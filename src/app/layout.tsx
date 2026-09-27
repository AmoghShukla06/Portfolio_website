import type { Metadata, Viewport } from "next";
import "./globals.css";
import { barlow, barlowCondensed, handel, highway } from "@/fonts/fonts";

export const metadata: Metadata = {
  metadataBase: new URL("https://portfoliojohn117.vercel.app"),
  title: "Amogh Shukla — AI engineer",
  description:
    "Portfolio of Amogh Shukla: AI engineer and CS student building LLM tooling, trading platforms and engines. Styled after the Halo series.",
  openGraph: {
    title: "Amogh Shukla — AI engineer",
    description:
      "LLM tooling, trading platforms and engines. A Halo-styled portfolio.",
    url: "/",
    siteName: "Amogh Shukla",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Amogh Shukla — AI engineer",
    description:
      "LLM tooling, trading platforms and engines. A Halo-styled portfolio.",
  },
};

export const viewport: Viewport = {
  themeColor: "#03060b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${handel.variable} ${highway.variable} ${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-ink bg-void flex flex-col">
        {children}
      </body>
    </html>
  );
}
