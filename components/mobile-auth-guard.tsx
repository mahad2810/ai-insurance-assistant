"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface MobileAuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function MobileAuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = "/auth/signin" 
}: MobileAuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle authentication redirects
  useEffect(() => {
    if (!isClient) return

    // Wait for session to be determined
    if (status === "loading") return

    // Debug logging for mobile
    if (typeof window !== 'undefined') {
      console.log('MobileAuthGuard:', { status, requireAuth, redirectTo, isClient })
    }

    if (requireAuth && status === "unauthenticated") {
      // Use window.location for better mobile compatibility
      const currentUrl = window.location.pathname + window.location.search
      const redirectUrl = `${redirectTo}?callbackUrl=${encodeURIComponent(currentUrl)}`

      console.log('Redirecting unauthenticated user to:', redirectUrl)

      // Add a small delay to ensure proper cleanup
      setTimeout(() => {
        window.location.href = redirectUrl
      }, 100)
      return
    }

    if (!requireAuth && status === "authenticated" && redirectTo) {
      // Redirect authenticated users away from auth pages
      console.log('Redirecting authenticated user to:', redirectTo)
      setTimeout(() => {
        window.location.href = redirectTo
      }, 100)
      return
    }
  }, [status, requireAuth, redirectTo, isClient])

  // Show loading state while determining authentication status
  if (!isClient || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show loading state while redirecting
  if (requireAuth && status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  // Show loading state while redirecting authenticated users
  if (!requireAuth && status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
