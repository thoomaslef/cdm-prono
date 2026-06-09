import "./globals.css";

export const metadata = {
  title: "Pronostic CDM 2026 — Powered by Claude AI",
  description:
    "Génère un pronostic complet pour n'importe quel match de la Coupe du Monde 2026 grâce à l'IA Claude.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0e1a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
