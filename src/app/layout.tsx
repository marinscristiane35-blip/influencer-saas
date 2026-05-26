import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Influencer SaaS",
  description: "Plataforma multiempresa para campanhas de influenciadores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
