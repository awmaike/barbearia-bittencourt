import { getAdminToken, getAdminUser } from "../../../admin-auth";

function config(token: string) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, headers: { apikey: key, authorization: `Bearer ${token}`, "content-type": "application/json" } };
}
export async function GET() {
  const token = await getAdminToken(); if (!(await getAdminUser()) || !token) return Response.json({ error: "Não autorizado." }, { status: 401 });
  const cfg = config(token); if (!cfg) return Response.json({ error: "Login não configurado." }, { status: 503 });
  const response = await fetch(`${cfg.url}/auth/v1/user`, { headers: cfg.headers, cache: "no-store" });
  const user = (await response.json()) as { factors?: Array<{ id: string; status: string; factor_type: string }> };
  return Response.json({ factors: (user.factors ?? []).filter((factor) => factor.factor_type === "totp") });
}
export async function POST(request: Request) {
  const token = await getAdminToken(); if (!(await getAdminUser()) || !token) return Response.json({ error: "Não autorizado." }, { status: 401 });
  const cfg = config(token); if (!cfg) return Response.json({ error: "Login não configurado." }, { status: 503 });
  const body = (await request.json()) as { action?: string; factorId?: string; code?: string };
  if (body.action === "enroll") {
    const response = await fetch(`${cfg.url}/auth/v1/factors`, { method: "POST", headers: cfg.headers, body: JSON.stringify({ factor_type: "totp", friendly_name: "Barbearia Bittencourt" }) });
    const data = await response.json(); return Response.json(data, { status: response.status });
  }
  if (body.action === "verify" && body.factorId && /^\d{6}$/.test(String(body.code ?? ""))) {
    const challengeResponse = await fetch(`${cfg.url}/auth/v1/factors/${body.factorId}/challenge`, { method: "POST", headers: cfg.headers, body: "{}" });
    const challenge = (await challengeResponse.json()) as { id?: string };
    if (!challenge.id) return Response.json({ error: "Falha ao criar validação." }, { status: 400 });
    const response = await fetch(`${cfg.url}/auth/v1/factors/${body.factorId}/verify`, { method: "POST", headers: cfg.headers, body: JSON.stringify({ challenge_id: challenge.id, code: body.code }) });
    const data = await response.json(); return Response.json(data, { status: response.status });
  }
  return Response.json({ error: "Ação inválida." }, { status: 400 });
}
export async function DELETE(request: Request) {
  const token = await getAdminToken(); if (!(await getAdminUser()) || !token) return Response.json({ error: "Não autorizado." }, { status: 401 });
  const cfg = config(token); if (!cfg) return Response.json({ error: "Login não configurado." }, { status: 503 });
  const { factorId } = (await request.json()) as { factorId?: string };
  const response = await fetch(`${cfg.url}/auth/v1/factors/${factorId}`, { method: "DELETE", headers: cfg.headers });
  const data = await response.json(); return Response.json(data, { status: response.status });
}
