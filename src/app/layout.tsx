import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const dmSerif = DM_Serif_Display({ subsets: ["latin"], variable: "--font-dm-serif", weight: "400", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "StudyBuddy AI", template: "%s | StudyBuddy AI" },
  description:
    "StudyBuddy AI is an AI-powered student productivity platform for smart notes, timetable planning, quizzes, doubt solving, reminders, analytics, and gamified studying.",
  keywords: [
    "StudyBuddy AI",
    "AI study assistant",
    "student productivity",
    "AI notes",
    "quiz generator",
    "timetable planner",
    "study reminders",
  ],
  openGraph: {
    title: "StudyBuddy AI - Study Smarter with AI",
    description:
      "AI-powered notes, timetable planning, quizzes, doubt solving, productivity tracking, and gamified studying in one intelligent platform.",
    siteName: "StudyBuddy AI",
    type: "website",
  },
  manifest: "/manifest.json",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StudyBuddy AI",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#060D1B" },
    { media: "(prefers-color-scheme: light)", color: "#4F8EF7" },
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="StudyBuddy AI" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${dmSans.variable} ${dmSerif.variable} ${jetBrainsMono.variable} font-dm-sans antialiased`}
        style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          storageKey="studybuddy-theme"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              className: "backdrop-blur-xl bg-white/70 dark:bg-[#1A1E2E]/80 border border-white/20 dark:border-white/10 shadow-2xl text-gray-800 dark:text-gray-100 font-medium tracking-wide",
              style: {
                borderRadius: "16px",
                fontFamily: "var(--font-dm-sans)",
                fontSize: "14px",
                padding: "16px 20px",
                maxWidth: "400px",
              },
              success: {
                iconTheme: {
                  primary: "#10B981",
                  secondary: "#ffffff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#ffffff",
                },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
