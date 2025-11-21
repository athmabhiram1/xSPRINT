"use client"

import Link from "next/link"
import { Menu, X, User, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "next/navigation"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check login status
    const role = localStorage.getItem("user_role")
    setIsLoggedIn(!!role)
    setIsAdmin(role === "admin")
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("user_role")
    setIsLoggedIn(false)
    setIsAdmin(false)
    router.push("/")
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-max flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-secondary font-bold text-lg">X</span>
          </div>
          <span className="font-heading font-bold text-lg hidden sm:inline">Xthlete</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/tournaments" className="text-sm font-medium hover:text-primary transition-colors">
            Tournaments
          </Link>
          <Link href="/fixtures" className="text-sm font-medium hover:text-primary transition-colors">
            Fixtures
          </Link>
          <Link href="/leaderboard" className="text-sm font-medium hover:text-primary transition-colors">
            Leaderboard
          </Link>
          {isAdmin && (
             <Link href="/admin" className="text-sm font-medium text-primary transition-colors">
             Admin Panel
           </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
             <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
             </div>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="container-max py-4 flex flex-col gap-4">
            <Link href="/tournaments" className="text-sm font-medium hover:text-primary">
              Tournaments
            </Link>
            <Link href="/fixtures" className="text-sm font-medium hover:text-primary">
              Fixtures
            </Link>
            <Link href="/leaderboard" className="text-sm font-medium hover:text-primary">
              Leaderboard
            </Link>
            {isAdmin && (
               <Link href="/admin" className="text-sm font-medium text-primary">
               Admin Panel
             </Link>
            )}
            <div className="flex flex-col gap-2 pt-2">
              {isLoggedIn ? (
                 <Button variant="outline" onClick={handleLogout} className="w-full">
                    Logout
                 </Button>
              ) : (
                <>
                  <Button variant="outline" asChild className="w-full bg-transparent">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}