"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Row = Record<string, string>;
type Overview = {
  counts: Record<string, number>;
  logs: Row[];
  errors: Row[];
  trash: Row[];
  settings: Record<string, string>;
  health: {
    database_ms: number;
    conflicts: number;
    orphan_slots: number;
    last_checked: string;
  };
};
const labels: Record<string, string> = {
  appointments: "Agendamentos",
  appointment_slots: "Horários ocupados",
  schedule_blocks: "Bloqueios",
  waitlist: "Lista de espera",
  cash_transactions: "Caixa",
  audit_logs: "Auditorias",
  support_trash: "Lixeira",
  error_logs: "Erros",
};
export default function SupportDashboard() {
  const [data, setData] = useState<Overview | null>(null),
    [results, setResults] = useState<Row[]>([]),
    [customer, setCustomer] = useState<{ summary: Row; history: Row[] } | null>(
      null,
    ),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(""),
    [tab, setTab] = useState("visao");
  const load = useCallback(async () => {
    const r = await fetch("/api/support", { cache: "no-store" });
    if (r.ok) setData(await r.json());
  }, []);
  useEffect(() => {
    const initial = setTimeout(load, 0),
      timer = setInterval(
        load,
        Math.max(5, Number(data?.settings.support_refresh_seconds || 15)) *
          1000,
      );
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [load, data?.settings.support_refresh_seconds]);
  async function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy("search");
    const q = new URLSearchParams(new FormData(e.currentTarget) as never),
      r = await fetch(`/api/support/search?${q}`),
      body = await r.json();
    setResults(body.results || []);
    setBusy("");
  }
  async function action(
    action: string,
    opts: { value?: string; id?: string; danger?: boolean } = {},
  ) {
    if (
      opts.danger &&
      !confirm(
        "Esta ação altera dados. Um registro de auditoria será criado. Confirma?",
      )
    )
      return;
    setBusy(action);
    setMessage("Processando…");
    if (action === "toggle_maintenance" && data)
      setData({
        ...data,
        settings: { ...data.settings, booking_maintenance: opts.value || "0" },
      });
    const r = await fetch("/api/support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          value: opts.value,
          id: opts.id,
          confirmation: opts.danger ? "LIMPAR" : "",
        }),
      }),
      body = await r.json();
    setMessage(body.message || body.error || "");
    setBusy("");
    void load();
  }
  async function openCustomer(phone: string) {
    setBusy("customer");
    const r = await fetch(
      `/api/support/customer?phone=${encodeURIComponent(phone)}`,
    );
    if (r.ok) setCustomer(await r.json());
    setBusy("");
  }
  const maintenance = data?.settings.booking_maintenance === "1";
  const repeatedErrors = data?.errors?.length ?? 0;
  return (
    <>
      <nav className="support-tabs">
        {[
          ["visao", "Visão geral"],
          ["pesquisa", "Clientes e reservas"],
          ["erros", "Erros e saúde"],
          ["manutencao", "Manutenção"],
          ["auditoria", "Auditoria"],
        ].map(([v, l]) => (
          <button
            className={tab === v ? "active" : ""}
            onClick={() => setTab(v)}
            key={v}
          >
            {l}
          </button>
        ))}
      </nav>
      {message && (
        <div className="support-message">
          <span>{message}</span>
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}
      {repeatedErrors >= 3 && (
        <div className="support-message" role="alert">
          <span>Atenção: há {repeatedErrors} erros recentes para analisar.</span>
          <button onClick={() => setTab("erros")}>Ver erros</button>
        </div>
      )}
      {tab === "visao" && (
        <>
          <section className="support-grid">
            <article className="support-card support-status">
              <span className="status-dot" />
              <div>
                <strong>Sistemas operacionais</strong>
                <p>
                  Resposta do banco em {data?.health.database_ms ?? "—"} ms ·
                  atualização automática
                </p>
              </div>
            </article>
            {data &&
              Object.entries(data.counts).map(([k, v]) => (
                <article className="support-card" key={k}>
                  <span>{labels[k] || k}</span>
                  <strong>{v}</strong>
                </article>
              ))}
          </section>
          <section className="support-panel">
            <div className="support-panel-head">
              <div>
                <p className="eyebrow">Ambiente</p>
                <h2>Central de demonstração</h2>
              </div>
              <span className="demo-badge">DEMONSTRAÇÃO</span>
            </div>
            <p>
              Dados de teste, PIX fictício e ferramentas protegidas. Última
              verificação:{" "}
              {data?.health.last_checked
                ? new Date(data.health.last_checked).toLocaleString("pt-BR")
                : "—"}
              .
            </p>
            <div className="support-actions">
              <button disabled={!!busy} onClick={() => action("simulate")}>
                {busy === "simulate" ? "Testando…" : "Executar teste completo"}
              </button>
              <a
                className="support-button secondary"
                href="/api/support/report"
              >
                Gerar relatório técnico
              </a>
            </div>
            <p className="support-hint">Último backup automático: {data?.settings.last_automatic_backup ? new Date(data.settings.last_automatic_backup).toLocaleString("pt-BR") : "será criado no próximo acesso ou agendamento"}.</p>
          </section>
        </>
      )}
      {tab === "pesquisa" && (
        <>
          <section className="support-panel">
            <p className="eyebrow">Pesquisa avançada</p>
            <h2>Clientes e agendamentos</h2>
            <form className="support-search advanced" onSubmit={search}>
              <input name="q" placeholder="Nome ou telefone" />
              <select name="barber">
                <option value="">Todos os barbeiros</option>
                <option>Pedrinho</option>
                <option>Treco</option>
              </select>
              <select name="service">
                <option value="">Todos os serviços</option>
                <option value="corte">Corte</option>
                <option value="barba">Barba</option>
                <option value="sobrancelha">Sobrancelha</option>
              </select>
              <select name="status">
                <option value="">Todos os status</option>
                <option value="confirmed">Confirmado</option>
                <option value="cancelled">Cancelado</option>
                <option value="completed">Concluído</option>
              </select>
              <select name="payment">
                <option value="">Todos os pagamentos</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </select>
              <input name="date" type="date" />
              <button disabled={busy === "search"}>
                {busy === "search" ? "Pesquisando…" : "Pesquisar"}
              </button>
            </form>
            <div className="support-table">
              {results.length === 0 ? (
                <p>Use os filtros para localizar registros.</p>
              ) : (
                results.map((r) => (
                  <button
                    className="support-row selectable"
                    key={r.id}
                    onClick={() => openCustomer(r.phone)}
                  >
                    <strong>{r.customer_name}</strong>
                    <span>{r.phone}</span>
                    <span>
                      {r.appointment_date} · {r.start_time}–{r.end_time}
                    </span>
                    <span>
                      {r.barber} · {r.service}
                    </span>
                    <span>
                      {r.status} · {r.payment_status}
                    </span>
                  </button>
                ))
              )}
            </div>
          </section>
          {customer && (
            <section className="support-panel customer-detail">
              <div className="support-panel-head">
                <div>
                  <p className="eyebrow">Ficha do cliente</p>
                  <h2>{customer.summary?.customer_name || "Cliente"}</h2>
                </div>
                <button onClick={() => setCustomer(null)}>Fechar</button>
              </div>
              <div className="customer-metrics">
                <span>
                  <strong>{customer.summary?.visits || 0}</strong> visitas
                </span>
                <span>
                  <strong>{customer.summary?.cancellations || 0}</strong>{" "}
                  cancelamentos
                </span>
                <span>
                  <strong>
                    R$ {Number(customer.summary?.total_paid || 0).toFixed(2)}
                  </strong>{" "}
                  recebido
                </span>
                <span>
                  <strong>{customer.summary?.last_visit || "—"}</strong> última
                  visita
                </span>
              </div>
              <div className="support-table">
                {customer.history.map((h) => (
                  <div className="support-row" key={h.id}>
                    <strong>{h.appointment_date}</strong>
                    <span>{h.start_time}</span>
                    <span>{h.barber}</span>
                    <span>{h.service}</span>
                    <span>{h.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
      {tab === "erros" && (
        <>
          <section className="support-grid health-grid">
            <article className="support-card">
              <span>Conflitos de horário</span>
              <strong className={data?.health.conflicts ? "bad" : "good"}>
                {data?.health.conflicts ?? 0}
              </strong>
            </article>
            <article className="support-card">
              <span>Horários órfãos</span>
              <strong className={data?.health.orphan_slots ? "bad" : "good"}>
                {data?.health.orphan_slots ?? 0}
              </strong>
            </article>
            <article className="support-card">
              <span>Tempo do banco</span>
              <strong>{data?.health.database_ms ?? "—"} ms</strong>
            </article>
          </section>
          <section className="support-panel">
            <p className="eyebrow">Central de erros</p>
            <h2>Ocorrências recentes</h2>
            <div className="support-table">
              {!data?.errors.length ? (
                <p>Nenhum erro registrado.</p>
              ) : (
                data.errors.map((e) => (
                  <div className="support-row error-row" key={e.id}>
                    <strong>{e.route}</strong>
                    <span>{e.message}</span>
                    <span>{e.created_at}</span>
                    <span>
                      {e.resolved_at ? (
                        "Resolvido"
                      ) : (
                        <button
                          onClick={() => action("resolve_error", { id: e.id })}
                        >
                          Marcar resolvido
                        </button>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
      {tab === "manutencao" && (
        <>
          <section
            className={`support-panel maintenance-card ${maintenance ? "is-on" : ""}`}
          >
            <div className="support-panel-head">
              <div>
                <p className="eyebrow">Disponibilidade</p>
                <h2>Modo manutenção</h2>
                <p>
                  {maintenance
                    ? "Novos agendamentos estão bloqueados."
                    : "A agenda está aberta ao público."}
                </p>
              </div>
              <button
                onClick={() =>
                  action("toggle_maintenance", {
                    value: maintenance ? "0" : "1",
                  })
                }
              >
                {maintenance ? "Reabrir agenda" : "Ativar manutenção"}
              </button>
            </div>
          </section>
          <section className="support-panel">
            <p className="eyebrow">Proteção de dados</p>
            <h2>Backup e limpeza</h2>
            <div className="support-actions">
              <a className="support-button" href="/api/support/backup">
                Backup completo JSON
              </a>
              <a
                className="support-button secondary"
                href="/api/support/export"
              >
                Agendamentos CSV
              </a>
              <button onClick={() => action("unlock", { danger: true })}>
                Desbloquear logins
              </button>
              <button
                className="danger-soft"
                onClick={() => action("clean_logs", { danger: true })}
              >
                Limpar logs +90 dias
              </button>
              <button
                className="danger-soft"
                onClick={() => action("clean_cancelled", { danger: true })}
              >
                Mover todos os cancelados para lixeira
              </button>
            </div>
          </section>
          <section className="support-panel">
            <p className="eyebrow">Lixeira recuperável</p>
            <h2>Itens removidos</h2>
            <div className="support-table">
              {!data?.trash.length ? (
                <p>A lixeira está vazia.</p>
              ) : (
                data.trash.map((t) => (
                  <div className="support-row" key={t.id}>
                    <strong>{t.entity_type}</strong>
                    <span>{t.entity_id}</span>
                    <span>{t.deleted_at}</span>
                    <span>
                      {t.restored_at ? (
                        "Restaurado"
                      ) : (
                        <button
                          onClick={() =>
                            action("restore", { id: t.id, danger: true })
                          }
                        >
                          Restaurar
                        </button>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
          <section className="support-panel">
            <p className="eyebrow">Preferências técnicas</p>
            <h2>Atualização automática</h2>
            <label className="setting-line">
              Atualizar o painel a cada{" "}
              <select
                value={data?.settings.support_refresh_seconds || "15"}
                onChange={(e) => action("settings", { value: e.target.value })}
              >
                <option value="5">5 segundos</option>
                <option value="15">15 segundos</option>
                <option value="30">30 segundos</option>
                <option value="60">1 minuto</option>
              </select>
            </label>
          </section>
        </>
      )}
      {tab === "auditoria" && (
        <section className="support-panel">
          <p className="eyebrow">Rastreabilidade</p>
          <h2>Últimas ações do sistema</h2>
          <div className="support-table">
            {data?.logs.map((l, i) => (
              <div className="support-row audit-row" key={i}>
                <strong>{l.action}</strong>
                <span>{l.actor}</span>
                <span>
                  {l.entity_type} {l.entity_id}
                </span>
                <span>{l.details || "—"}</span>
                <span>{l.created_at}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
