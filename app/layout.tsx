import type { Metadata } from "next";
import "./globals.css";
import "./test-button.css";

export const metadata: Metadata = {
  title: "Barbearia Bittencourt",
  description:
    "Cortes, barba e sobrancelha no centro de Serafina Corrêa. Agende seu horário online.",
  metadataBase: new URL("https://bittencourt.maikedev.com.br"),
  openGraph: {
    title: "Barbearia Bittencourt",
    description:
      "Seu estilo, seu momento. Agende corte, barba e sobrancelha online.",
    url: "https://bittencourt.maikedev.com.br",
    siteName: "Barbearia Bittencourt",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/barbearia-hero.png",
        width: 1536,
        height: 1024,
        alt: "Barbearia Bittencourt",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Barbearia Bittencourt",
    description: "Agende seu horário online.",
    images: ["/barbearia-hero.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/logo-bittencourt.png", type: "image/png", sizes: "150x150" },
    ],
    shortcut: "/logo-bittencourt.png",
    apple: "/logo-bittencourt.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
