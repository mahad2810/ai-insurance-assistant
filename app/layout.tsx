import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navbar"
import AnimatedBackground from "@/components/animated-background"
import AuthProvider from "@/components/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
// Import initialization script (runs only on server)
import "@/lib/init"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Insurance Assistant",
  description: "Ask anything about your insurance policy with AI-powered analysis",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            <AnimatedBackground />
            <div className="relative z-10">
              <Navbar />
              <main className="min-h-screen">{children}</main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
