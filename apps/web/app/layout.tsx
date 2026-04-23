import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@multica/ui/components/ui/sonner";
import { cn } from "@multica/ui/lib/utils";
import { WebProviders } from "@/components/web-providers";
import { I18nProvider } from "@multica/views/i18n";
import "./globals.css";

// Font stack: Inter for Latin UI text + system Chinese fonts for zh content.
// Desktop app uses the same stack via apps/desktop/src/renderer/src/globals.css —
// keep the CJK fallback tail in sync across both files. The Inter primary family
// differs by design: next/font produces `__Inter_xxx` (with a synthetic size-adjusted
// fallback face to prevent FOUT layout shift); desktop uses fontsource's "Inter Variable".
// Both resolve to Inter glyphs, so rendering is identical in practice.
// Currently covers English + Simplified Chinese. When ja/ko i18n lands, extend
// the tail with Hiragino Kaku Gothic ProN / Yu Gothic / Apple SD Gothic Neo / Malgun Gothic.
// Per-character fallback: Latin chars render with Inter, Chinese chars with
// PingFang SC (macOS) / Microsoft YaHei (Windows) / Noto Sans CJK SC (Linux).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "PingFang SC",
    "Microsoft YaHei",
    "Noto Sans CJK SC",
    "sans-serif",
  ],
});
// Mono font has no explicit CJK fallback: CJK chars in code blocks are inherently
// non-aligned with a mono grid (Chinese is proportional), so listing CJK fonts
// here would falsely signal alignment guarantees. Browser default fallback handles
// the rare mixed case correctly.
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});
// Editorial serif used for onboarding headlines. Italic support for h1 em
// accents (e.g. "...on one shared board."). Only loaded on routes that
// render the font; layout-shift-prevention handled by next/font's synthetic
// fallback metrics, same as Inter.
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  fallback: [
    "ui-serif",
    "Iowan Old Style",
    "Apple Garamond",
    "Baskerville",
    "Times New Roman",
    "serif",
  ],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#05070b" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Brian's MultiCarrier",
    template: "%s | Brian's MultiCarrier",
  },
  description:
    "\uc0ac\ub78c\uacfc \uc5d0\uc774\uc804\ud2b8\uac00 \ud568\uaed8 \uc77c\ud558\ub294 \ub098\ub9cc\uc758 \uc791\uc5c5\uc2e4.",
  icons: {
    icon: [{ url: "/icon.jpeg", type: "image/jpeg" }],
    shortcut: ["/icon.jpeg"],
  },
  openGraph: {
    type: "website",
    siteName: "Brian's MultiCarrier",
    locale: "ko_KR",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn("antialiased font-sans h-full", inter.variable, geistMono.variable, sourceSerif.variable)}
    >
      <body className="h-full overflow-hidden">
        <I18nProvider>
          <ThemeProvider defaultTheme="dark" enableSystem={false}>
            <WebProviders>
              {children}
            </WebProviders>
            <Toaster />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
