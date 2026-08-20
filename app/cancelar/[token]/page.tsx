import CancelAppointment from "./CancelAppointment";

export default async function CancelPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <CancelAppointment token={token} />;
}
