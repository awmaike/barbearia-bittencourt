import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminUser } from "../../admin-auth";
import PasswordForm from "./PasswordForm";
import MfaForm from "./MfaForm";

export const dynamic = "force-dynamic";
export default async function AccountPage() {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return (
    <main className="admin-shell">
      <div className="admin-header">
        <div>
          <p className="eyebrow">Barbearia Bittencourt</p>
          <h1>Minha conta</h1>
          <p>Conta conectada: {admin.displayName}</p>
        </div>
        <div>
          <Link href="/admin">Voltar à agenda</Link>
          <a href="/api/admin/logout">Sair</a>
        </div>
      </div>
      <PasswordForm />
      <MfaForm />
    </main>
  );
}
