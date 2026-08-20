const ADMIN_COOKIE = "bittencourt_admin_access";
const SUPPORT_COOKIE = "bittencourt_support_access";
import { getD1 } from "../../../d1";

async function attemptKey(request: Request, username: string) {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown";
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${username}|${ip}`),
  );
  return Array.from(new Uint8Array(bytes))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}
export async function POST(request: Request) {
  const url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    return Response.json(
      { error: "Login ainda não configurado." },
      { status: 503 },
    );
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };
  const username = String(body.username ?? "")
      .trim()
      .toLowerCase(),
    password = String(body.password ?? "");
  if (!username || password.length < 8)
    return Response.json(
      { error: "Usuário ou senha inválidos." },
      { status: 400 },
    );
  const database = await getD1();
  const keyHash = await attemptKey(request, username);
  const previous = await database
    .prepare("SELECT attempts, blocked_until FROM login_attempts WHERE key = ?")
    .bind(keyHash)
    .first<{ attempts: string; blocked_until: string | null }>();
  if (
    previous?.blocked_until &&
    new Date(previous.blocked_until).getTime() > Date.now()
  )
    return Response.json(
      { error: "Muitas tentativas. Aguarde 15 minutos." },
      { status: 429 },
    );
  let loginMap: Record<string, string> = {};
  try {
    loginMap = JSON.parse(process.env.ADMIN_LOGIN_MAP ?? "{}");
  } catch {
    loginMap = {};
  }
  const email = loginMap[username];
  if (!email) {
    await recordFailure(database, keyHash, previous);
    return Response.json(
      { error: "Usuário ou senha incorretos." },
      { status: 401 },
    );
  }
  const authResponse = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: key, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const auth = (await authResponse.json()) as {
    access_token?: string;
    expires_in?: number;
    user?: { app_metadata?: { admin?: boolean; role?: string }; factors?: Array<{ id: string; status: string; factor_type: string }> };
  };
  const isSupport = email === process.env.SUPPORT_EMAIL;
  if (
    !authResponse.ok ||
    !auth.access_token ||
    (!isSupport && auth.user?.app_metadata?.admin !== true)
  ) {
    await recordFailure(database, keyHash, previous);
    return Response.json(
      { error: "Usuário ou senha incorretos." },
      { status: 401 },
    );
  }
  await database
    .prepare("DELETE FROM login_attempts WHERE key = ?")
    .bind(keyHash)
    .run();
  const verifiedFactor = auth.user?.factors?.find((factor) => factor.status === "verified" && factor.factor_type === "totp");
  if (verifiedFactor) {
    const role = isSupport ? "support" : "admin";
    const pendingCookie = isSupport ? "bittencourt_support_mfa_pending" : "bittencourt_admin_mfa_pending";
    return new Response(JSON.stringify({ ok: true, mfaRequired: true, factorId: verifiedFactor.id, role }), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "set-cookie": `${pendingCookie}=${encodeURIComponent(auth.access_token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`,
      },
    });
  }
  const maxAge = Math.min(Number(auth.expires_in ?? 3600), 3600);
  const destination = isSupport ? "/suporte" : "/admin";
  const accessCookie = isSupport ? SUPPORT_COOKIE : ADMIN_COOKIE;
  return new Response(JSON.stringify({ ok: true, destination }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "set-cookie": `${accessCookie}=${encodeURIComponent(auth.access_token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
    },
  });
}

async function recordFailure(
  database: D1Database,
  key: string,
  previous: { attempts: string; blocked_until: string | null } | null,
) {
  const attempts = Number(previous?.attempts ?? 0) + 1;
  const blockedUntil =
    attempts >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null;
  await database
    .prepare(
      "INSERT INTO login_attempts (key, attempts, blocked_until, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET attempts = excluded.attempts, blocked_until = excluded.blocked_until, updated_at = CURRENT_TIMESTAMP",
    )
    .bind(key, String(attempts), blockedUntil)
    .run();
}
