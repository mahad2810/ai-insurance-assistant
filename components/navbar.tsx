"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Home, MessageSquare, History, Info, Menu, X, LogOut, LogIn, User } from "lucide-react"
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
  const [isOpen, setIsOpen] = useState(false)
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

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

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/history", label: "History", icon: History, requiresAuth: true },
    { href: "/about", label: "About", icon: Info },
  ]

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-gray-900/20 border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              InsureAI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems
              .filter(item => !item.requiresAuth || (item.requiresAuth && isAuthenticated))
              .map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
            ))}
            
            {isAuthenticated ? (
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
                  <DropdownMenuItem className="text-gray-200 focus:bg-white/10 focus:text-white cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    className="text-gray-200 focus:bg-white/10 focus:text-white cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/signin">
                <Button variant="default" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden py-4 border-t border-white/10"
          >
            <div className="flex flex-col space-y-2">
              {navItems
                .filter(item => !item.requiresAuth || (item.requiresAuth && isAuthenticated))
                .map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10"
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Button>
                  </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <div className="pt-2 pb-2 border-t border-white/10">
                    <div className="flex items-center px-4 py-2 space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "User"} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600">
                          {getInitials(session?.user?.name || "User")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          {session?.user?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {session?.user?.email || ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-white/10 mt-2"
                      onClick={() => {
                        handleSignOut();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </Button>
                  </div>
                </>
              ) : (
                <Link href="/auth/signin" className="w-full" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}
