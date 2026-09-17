import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lingova - Elemental Pronunciation",
  description: "An interactive English pronunciation exercise in the style of Avatar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
