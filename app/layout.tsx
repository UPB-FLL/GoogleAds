import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Google Ads Policy Guard",
  description: "Draft Google Ads with local policy checks before submission."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
