"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Grid3x3, Clock, Settings, Lock } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

const menuItems = [
  { label: "Dashboard", icon: Trophy, href: "/admin" },
  { label: "Players", icon: Users, href: "/admin/players" },
  { label: "Fixtures", icon: Grid3x3, href: "/admin/fixtures" },
  { label: "Schedule", icon: Clock, href: "/admin/schedule" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
]

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem("user_role")
    if (role !== "admin") {
      // Redirect if not admin
      router.push("/login")
    } else {
      setIsAuthorized(true)
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>

  if (!isAuthorized) return null; // Prevent flash of content

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside
          className={`border-r border-border bg-card transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"} hidden md:block`}
        >
          <nav className="space-y-2 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-foreground/80 hover:text-primary"
                >
                  <Icon size={20} />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-muted/10">
          <div className="container-max py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="mb-1 text-3xl font-bold">Dashboard</h1>
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full border border-primary/20">Admin Mode</span>
                </div>
                <p className="text-muted-foreground">Welcome back, Organizer.</p>
              </div>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-lg md:block hidden">
                <Grid3x3 size={20} />
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Players", value: "2,847", icon: Users, trend: "+12%" },
                { label: "Active Matches", value: "24", icon: Trophy, trend: "Live" },
                { label: "Tournaments", value: "12", icon: Grid3x3, trend: "2 Pending" },
                { label: "Courts in Use", value: "8/10", icon: Clock, trend: "High Traffic" },
              ].map((kpi) => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1 font-medium">{kpi.label}</p>
                        <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                        <p className="text-xs text-emerald-500 mt-2 font-medium">{kpi.trend}</p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Icon className="text-primary" size={24} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
                 <h3 className="font-bold text-lg mb-2">Fixture Management</h3>
                 <p className="text-sm text-muted-foreground mb-4">Generate brackets for upcoming tournaments.</p>
                 <Button size="lg" className="w-full">Generate Fixtures</Button>
              </div>
              <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 p-6 rounded-xl border border-secondary/20">
                 <h3 className="font-bold text-lg mb-2">Schedule Management</h3>
                 <p className="text-sm text-muted-foreground mb-4">Auto-assign courts and timeslots.</p>
                 <Button size="lg" variant="outline" className="w-full bg-background">Generate Schedule</Button>
              </div>
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Players Table */}
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="font-heading font-bold">Recent Registrations</h3>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="p-4 text-left font-medium text-muted-foreground">Name</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Club</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Saina Nehwal", club: "Mumbai Sports", status: "Approved" },
                        { name: "PV Sindhu", club: "Hyderabad Champs", status: "Approved" },
                        { name: "Srikanth Kidambi", club: "Bangalore", status: "Pending" },
                      ].map((player, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{player.name}</td>
                          <td className="p-4 text-muted-foreground">{player.club}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                player.status === "Approved"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}
                            >
                              {player.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Matches Table */}
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="font-heading font-bold">Active Matches</h3>
                  <Button variant="ghost" size="sm">Live Console</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="p-4 text-left font-medium text-muted-foreground">Match</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Court</th>
                        <th className="p-4 text-left font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { match: "Saina vs Jwala", court: "Court 1", status: "Live" },
                        { match: "Sindhu vs Srikanth", court: "Court 2", status: "Scheduled" },
                        { match: "Prakash vs Chirag", court: "Court 3", status: "Completed" },
                      ].map((m, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{m.match}</td>
                          <td className="p-4 text-muted-foreground">{m.court}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                m.status === "Live"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                                  : m.status === "Completed"
                                    ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                    : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}