import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_JP } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { ConvexClientProvider } from "@/components/convex-provider";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

const defaultUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Family Houses",
  description: "Manage properties & groceries",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  display: "swap",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider telemetry={false}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${plusJakarta.variable} ${notoSansJP.variable} antialiased`}
        >
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <I18nProvider>
                {children}
                <Toaster position="top-center" richColors closeButton />
              </I18nProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
