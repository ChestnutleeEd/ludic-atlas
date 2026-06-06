import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Game Earth",
  description: "Explore representative games by country and region.",
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
