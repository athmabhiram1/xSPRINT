"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Users, Trophy, Grid3x3, Clock, Settings } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const menuItems = [
  { label: "Dashboard", icon: Trophy, href: "/admin" },
  { label: "Players", icon: Users, href: "/admin/players" },
  { label: "Fixtures", icon: Grid3x3, href: "/admin/fixtures" },
  { label: "Schedule", icon: Clock, href: "/admin/schedule" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
]

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside
          className={`border-r border-border bg-card transition-all duration-300 ${sidebarOpen ? "w-64" : "w-20"}`}
        >
          <nav className="space-y-2 p-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <Icon size={20} className="text-primary" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="container-max py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="mb-1">Dashboard</h1>
                <p className="text-muted-foreground">Welcome to Admin Panel</p>
              </div>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-muted rounded-lg">
                <Grid3x3 size={20} />
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[
                { label: "Total Players", value: "2,847", icon: Users },
                { label: "Active Matches", value: "24", icon: Trophy },
                { label: "Tournaments", value: "12", icon: Grid3x3 },
                { label: "Courts in Use", value: "8", icon: Clock },
              ].map((kpi) => {
                const Icon = kpi.icon
                return (
                  <div key={kpi.label} className="bg-card rounded-lg border border-border p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{kpi.label}</p>
                        <p className="text-3xl font-bold">{kpi.value}</p>
                      </div>
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Icon className="text-primary" size={24} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Button size="lg" className="w-full">
                Generate Fixtures
              </Button>
              <Button size="lg" className="w-full">
                Generate Schedule
              </Button>
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Players Table */}
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="font-heading font-bold">Recent Registrations</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="p-4 text-left">Name</th>
                        <th className="p-4 text-left">Club</th>
                        <th className="p-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Saina Nehwal", club: "Mumbai Sports", status: "Approved" },
                        { name: "PV Sindhu", club: "Hyderabad Champs", status: "Approved" },
                        { name: "Srikanth Kidambi", club: "Bangalore", status: "Pending" },
                      ].map((player, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-muted">
                          <td className="p-4">{player.name}</td>
                          <td className="p-4">{player.club}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                player.status === "Approved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
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
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="font-heading font-bold">Active Matches</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="p-4 text-left">Match</th>
                        <th className="p-4 text-left">Court</th>
                        <th className="p-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { match: "Saina vs Jwala", court: "Court 1", status: "Live" },
                        { match: "Sindhu vs Srikanth", court: "Court 2", status: "Scheduled" },
                        { match: "Prakash vs Chirag", court: "Court 3", status: "Completed" },
                      ].map((m, idx) => (
                        <tr key={idx} className="border-b border-border hover:bg-muted">
                          <td className="p-4">{m.match}</td>
                          <td className="p-4">{m.court}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                m.status === "Live"
                                  ? "bg-primary/20 text-primary"
                                  : m.status === "Completed"
                                    ? "bg-gray-200 text-gray-800"
                                    : "bg-blue-100 text-blue-800"
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
