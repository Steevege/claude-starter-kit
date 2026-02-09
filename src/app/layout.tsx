import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mon Livre de Recettes",
  description: "Application familiale de gestion de recettes de cuisine",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mes Recettes",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#c2410c" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body
        className={`${nunito.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
