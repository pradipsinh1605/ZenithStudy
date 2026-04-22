import type { Metadata, Viewport } from "next";
import { Sora, Lora } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "StudyBuddy AI — Your Academic Success Hub",
    template: "%s | StudyBuddy AI",
  },
  description: "AI-powered student productivity platform.",
  keywords: ["study app", "student productivity", "AI tutor", "flashcards"],
  authors: [{ name: "StudyBuddy AI" }],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#060D1B" },
    { media: "(prefers-color-scheme: light)", color: "#F5F3EE" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${sora.variable} ${lora.variable} font-sora antialiased`}
        style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "12px",
                fontFamily: "var(--font-sora)",
                fontSize: "13px",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
