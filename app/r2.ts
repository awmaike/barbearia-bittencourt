export async function getR2(): Promise<R2Bucket> {
  const { env } = await import("cloudflare:workers");
  const bucket = (env as unknown as { BUCKET?: R2Bucket }).BUCKET;
  if (!bucket) throw new Error("Armazenamento de arquivos indisponível.");
  return bucket;
}
