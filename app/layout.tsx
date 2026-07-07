import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Banco de Profissionais | Piso de Concreto",
  description:
    "Cadastro técnico de profissionais para empresas de piso de concreto.",
  applicationName: "BP Piso",
  appleWebApp: {
    capable: true,
    title: "BP Piso",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      {
        url: "/favicon.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Banco de Profissionais | Piso de Concreto",
    description:
      "Cadastro técnico de profissionais para empresas de piso de concreto.",
    siteName: "BP Piso",
    images: [
      {
        url: "/logo-bp.png",
        width: 1200,
        height: 1200,
        alt: "Banco de Profissionais Piso de Concreto",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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