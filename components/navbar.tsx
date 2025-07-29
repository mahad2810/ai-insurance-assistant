"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LogOut,
  LogIn,
  User,
  UserPlus,
  Home,
  MessageSquare,
  History,
  Info,
  LayoutDashboard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession, signOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "New Chat", href: "/chat", icon: MessageSquare },
    { name: "History", href: "/history", icon: History },
    { name: "About", href: "/about", icon: Info },
  ]

  // Get initials from user's name
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gray-900/90 sm:bg-gray-900/20 border-b border-white/10 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xs sm:text-sm">AI</span>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              InsureAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Navigation Links */}
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>

          {/* Mobile Navigation */}
          {/* Navigation and Profile Menu */}
          <div className="flex items-center space-x-2">
            {/* Only show menu if authenticated */}
            {status === "authenticated" && (
              <>
                {/* Mobile Menu */}
                <div className="lg:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-gray-900/90 backdrop-blur-lg border-white/10" align="end">
                      {navigationItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link key={item.name} href={item.href}>
                            <DropdownMenuItem className="text-gray-200 focus:bg-white/10 focus:text-white cursor-pointer">
                              <Icon className="mr-2 h-4 w-4" />
                              <span>{item.name}</span>
                            </DropdownMenuItem>
                          </Link>
                        )
                      })}
                      <DropdownMenuSeparator className="bg-white/10" />
                      <Link href="/profile">
                        <DropdownMenuItem className="text-gray-200 focus:bg-white/10 focus:text-white cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-gray-200 focus:bg-white/10 focus:text-white cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Desktop Profile Menu */}
                <div className="hidden lg:flex">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600">
                            {getInitials(session?.user?.name || "User")}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-gray-900/90 backdrop-blur-lg border-white/10" align="end">
                      <DropdownMenuLabel className="text-gray-200">
                        {session?.user?.name || session?.user?.email}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <Link href="/profile">
                        <DropdownMenuItem className="text-gray-200 focus:bg-white/10 focus:text-white cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem
                        onClick={handleSignOut}
                        className="text-gray-200 focus:bg-white/10 focus:text-white cursor-pointer"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
