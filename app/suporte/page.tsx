import { redirect } from "next/navigation";
import Link from "next/link";
import { getSupportUser } from "../admin-auth";
import SupportDashboard from "./SupportDashboard";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const user = await getSupportUser();
  if (!user) redirect("/admin/login");
  return (
    <main className="support-shell">
      <header className="support-header">
        <div>
          <p className="eyebrow">Central técnica</p>
          <h1>Suporte e manutenção</h1>
          <p>Diagnósticos e ferramentas seguras para {user.displayName}.</p>
        </div>
        <nav>
          <Link href="/">Ver site</Link>
          <a href="/api/admin/logout?scope=support">Sair</a>
        </nav>
      </header>
      <SupportDashboard />
    </main>
  );
}
