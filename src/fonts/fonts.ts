import localFont from "next/font/local";
import { Barlow, Barlow_Condensed } from "next/font/google";

// Display face — the Halo logotype lineage.
export const handel = localFont({
  src: "./HandelGothic.ttf",
  variable: "--font-handel",
  display: "swap",
});

export const highway = localFont({
  src: "./HighwayGothic.ttf",
  variable: "--font-highway",
  display: "swap",
});

// Body + HUD readouts. Barlow is drawn from highway signage, a sibling of Highway Gothic.
export const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow",
  display: "swap",
});

export const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-barlow-condensed",
  display: "swap",
});
