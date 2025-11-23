import type React from "react"
import type { Metadata } from "next"
import { Inter, Manrope } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import ThemeToggle from '@/components/theme-toggle';
import { AppProviders } from './providers';
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const manrope = Manrope({ subsets: ["latin"], variable: "--font-heading" })

export const metadata: Metadata = {
  title: "Xthlete Arena - Smart Tournament Management",
  description: "Professional tournament management system for clubs, players, and organizers",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} font-sans antialiased bg-background text-foreground`}>
        <AppProviders>
          <ThemeToggle />
          {children}
          <Analytics />
        </AppProviders>
      </body>
    </html>
  )
}
