import {
  DM_Sans,
  Figtree,
  Geist,
  Inter,
  JetBrains_Mono,
  Merriweather,
  Nunito_Sans,
  Playfair_Display,
  Roboto,
} from "next/font/google";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const roboto = Roboto({
  subsets: ["latin"],
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-merriweather",
  weight: ["400", "700"],
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
});

export const fontRegistry = {
  geist: {
    label: "Geist",
    font: geist,
  },
  inter: {
    label: "Inter",
    font: inter,
  },
  dmSans: {
    label: "DM Sans",
    font: dmSans,
  },
  figtree: {
    label: "Figtree",
    font: figtree,
  },
  roboto: {
    label: "Roboto",
    font: roboto,
  },
  nunitoSans: {
    label: "Nunito Sans",
    font: nunitoSans,
  },
  jetBrainsMono: {
    label: "JetBrains Mono",
    font: jetBrainsMono,
  },
  merriweather: {
    label: "Merriweather",
    font: merriweather,
  },
  playfairDisplay: {
    label: "Playfair Display",
    font: playfairDisplay,
  },
} as const;

export type FontKey = keyof typeof fontRegistry;

const legacyFontAliases: Record<string, FontKey> = {
  geistMono: "jetBrainsMono",
  geistPixelSquare: "jetBrainsMono",
  lora: "merriweather",
  notoSans: "inter",
  notoSerif: "merriweather",
  outfit: "figtree",
  publicSans: "inter",
  raleway: "figtree",
  robotoSlab: "merriweather",
};

export function normalizeFontKey(value: string | null | undefined): FontKey | undefined {
  if (!value) return undefined;
  if (value in fontRegistry) return value as FontKey;
  return legacyFontAliases[value];
}

export const fontVars = (Object.values(fontRegistry) as Array<(typeof fontRegistry)[FontKey]>)
  .map((f) => f.font.variable)
  .join(" ");

export const fontOptions = (Object.entries(fontRegistry) as Array<[FontKey, (typeof fontRegistry)[FontKey]]>).map(
  ([key, f]) => ({
    key,
    label: f.label,
    variable: f.font.variable,
  }),
);
