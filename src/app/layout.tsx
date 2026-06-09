import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ludic Atlas / 游戏星图",
  description: "Explore games through space and time.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
