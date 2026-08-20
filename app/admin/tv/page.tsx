import { redirect } from "next/navigation";
import { getAdminUser } from "../../admin-auth";
import TVBoard from "./TVBoard";
export const dynamic = "force-dynamic";
export default async function TVPage() {
  if (!(await getAdminUser())) redirect("/admin/login");
  return <TVBoard />;
}
