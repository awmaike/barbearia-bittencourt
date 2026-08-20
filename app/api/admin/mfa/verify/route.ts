import { cookies } from "next/headers";

export async function POST(request: Request) {
  const { factorId, code, role } = (await request.json()) as { factorId?: string; code?: string; role?: "admin" | "support" };
  const support = role === "support";
  const token = (await cookies()).get(support ? "bittencourt_support_mfa_pending" : "bittencourt_admin_mfa_pending")?.value;
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key || !factorId || !/^\d{6}$/.test(String(code ?? "")))
    return Response.json({ error: "Código inválido ou expirado." }, { status: 400 });
  const headers = { apikey: key, authorization: `Bearer ${token}`, "content-type": "application/json" };
  const challengeResponse = await fetch(`${url}/auth/v1/factors/${factorId}/challenge`, { method: "POST", headers, body: "{}" });
  const challenge = (await challengeResponse.json()) as { id?: string };
  if (!challengeResponse.ok || !challenge.id) return Response.json({ error: "Não foi possível validar o código." }, { status: 400 });
  const verifyResponse = await fetch(`${url}/auth/v1/factors/${factorId}/verify`, { method: "POST", headers, body: JSON.stringify({ challenge_id: challenge.id, code }) });
  const verified = (await verifyResponse.json()) as { access_token?: string; expires_in?: number; user?: { email?: string } };
  if (!verifyResponse.ok || !verified.access_token) return Response.json({ error: "Código incorreto." }, { status: 401 });
  const isSupport = verified.user?.email === process.env.SUPPORT_EMAIL;
  const destination = isSupport ? "/suporte" : "/admin";
  const accessCookie = isSupport ? "bittencourt_support_access" : "bittencourt_admin_access";
  return new Response(JSON.stringify({ ok: true, destination }), { headers: { "content-type": "application/json", "set-cookie": `${accessCookie}=${encodeURIComponent(verified.access_token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.min(Number(verified.expires_in ?? 3600), 3600)}` } });
}
