import { cookies } from "next/headers";

const ADMIN_COOKIE = "bittencourt_admin_access";
const SUPPORT_COOKIE = "bittencourt_support_access";
const authCache = new Map<
  string,
  { expires: number; user: BackofficeUser | null }
>();

export async function getAdminToken() {
  return (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
}

export async function getSupportToken() {
  return (await cookies()).get(SUPPORT_COOKIE)?.value ?? null;
}

export type BackofficeUser = {
  email: string;
  displayName: string;
  role: "admin" | "support";
};

async function userFromToken(token: string | null): Promise<BackofficeUser | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  if (!token) return null;
  const cached = authCache.get(token);
  if (cached && cached.expires > Date.now()) return cached.user;
  try {
    const response = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: key, authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const user = (await response.json()) as {
      email?: string;
      app_metadata?: { admin?: boolean; role?: string };
      user_metadata?: { name?: string };
    };
    const isSupport = user.email === process.env.SUPPORT_EMAIL;
    if (!user.email || (user.app_metadata?.admin !== true && !isSupport)) {
      authCache.set(token, { expires: Date.now() + 15_000, user: null });
      return null;
    }
    const result: BackofficeUser = {
      email: user.email,
      displayName: user.user_metadata?.name || user.email,
      role: isSupport ? "support" : "admin",
    };
    if (authCache.size > 100) authCache.clear();
    authCache.set(token, { expires: Date.now() + 45_000, user: result });
    return result;
  } catch {
    return null;
  }
}

export async function getBackofficeUser(): Promise<BackofficeUser | null> {
  return (await userFromToken(await getAdminToken())) ?? userFromToken(await getSupportToken());
}

export async function getAdminUser() {
  const user = await userFromToken(await getAdminToken());
  return user?.role === "admin" ? user : null;
}

export async function getSupportUser() {
  const user = await userFromToken(await getSupportToken());
  return user?.role === "support" ? user : null;
}
