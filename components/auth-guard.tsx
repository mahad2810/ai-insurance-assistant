"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"

const publicPaths = new Set(["/", "/auth/signin", "/auth/register", "/about"])

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Don't do anything while loading
    if (status === "loading") return

    // If the user is not authenticated and trying to access a private path
    if (status === "unauthenticated" && !publicPaths.has(pathname)) {
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`)
    }

    // If the user is authenticated and trying to access an auth page
    if (status === "authenticated" && pathname.startsWith("/auth/")) {
      router.replace("/dashboard")
    }
  }, [status, router, pathname])

  // If we're on a private path and not authenticated, don't render anything
  if (!publicPaths.has(pathname) && status === "unauthenticated") {
    return null
  }

  return <>{children}</>
}
