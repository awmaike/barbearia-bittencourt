import { redirect } from "next/navigation";
import { getAdminUser } from "../admin-auth";
import AdminDashboard from "./AdminDashboard";
import Link from "next/link";
import InstallApp from "./InstallApp";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return (
    <main className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Barbearia Bittencourt</p>
          <h1>Agenda dos barbeiros</h1>
          <p>
            Olá, {admin.displayName}. Veja todos os horários do dia e cancele
            reservas quando necessário.
          </p>
          <InstallApp />
        </div>
        <div>
          <Link href="/">Ver site</Link>
          <Link href="/admin/conta">Minha conta</Link>
          <a href="/api/admin/logout">Sair</a>
        </div>
      </div>
      <AdminDashboard />
    </main>
  );
}
