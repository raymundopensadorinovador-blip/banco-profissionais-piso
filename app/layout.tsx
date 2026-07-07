import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banco de Profissionais | Piso de Concreto",
  description:
    "Cadastro técnico de profissionais para empresas de piso de concreto.",
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