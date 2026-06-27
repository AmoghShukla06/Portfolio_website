import type { Metadata } from "next";
import "./globals.css";
import { highway } from "@/fonts/fonts";

export const metadata: Metadata = {
  title: "Amogh Shukla",
  description: "Portfolio Website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${highway.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}