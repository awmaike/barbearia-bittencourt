import { getSupportUser } from "../../../admin-auth";
import { getD1 } from "../../../d1";
export async function GET() {
  if (!(await getSupportUser()))
    return new Response("Não autorizado.", { status: 401 });
  const db = await getD1();
  const a = await db
    .prepare(
      "SELECT COUNT(*) total,SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) confirmed,SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) cancelled FROM appointments",
    )
    .first<Record<string, number>>();
  const e = await db
    .prepare("SELECT COUNT(*) n FROM error_logs WHERE resolved_at IS NULL")
    .first<{ n: number }>();
  const text = `RELATÓRIO TÉCNICO — BARBEARIA BITTENCOURT\nGerado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\nBanco de dados: operacional\nAgendamentos: ${a?.total || 0}\nConfirmados: ${a?.confirmed || 0}\nCancelados: ${a?.cancelled || 0}\nErros pendentes: ${e?.n || 0}\n\nEste relatório não contém senhas nem dados completos de clientes.`;
  return new Response(text, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": "attachment; filename=relatorio-tecnico.txt",
    },
  });
}
