"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TournamentCard } from "@/components/tournament-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { getTournaments, Tournament, formatDate, getSportEmoji } from "@/lib/api"

const categories = ["All", "Badminton", "Basketball", "Cricket", "Football", "Chess", "Pickleball"]

export default function TournamentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true)
        const data = await getTournaments({ includeEvents: true, includeCourts: true })
        if (data.success) {
          setTournaments(data.tournaments || [])
        } else {
          setError(data.error || "Failed to fetch tournaments")
        }
      } catch (err: any) {
        console.error("Error fetching tournaments:", err)
        setError(err.message || "Failed to fetch tournaments")
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch =
      tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.location.toLowerCase().includes(searchTerm.toLowerCase())

    // Filter by sport if events exist
    const matchesCategory = selectedCategory === "All" ||
      tournament.events?.some(event => event.sport.toLowerCase() === selectedCategory.toLowerCase())

    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-gradient-to-br from-secondary to-neutral-900 text-white py-16">
        <div className="container-max">
          <h1 className="mb-2">Browse Tournaments</h1>
          <p className="text-gray-300">Find and register for tournaments near you</p>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="bg-background border-b border-border sticky top-16 z-40 shadow-sm">
        <div className="container-max py-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <Input
                placeholder="Search tournaments or location..."
                className="pl-10 bg-muted/30"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Filter size={20} />
              More Filters
            </Button>
          </div>

          {/* Category Tags */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${selectedCategory === cat
                  ? "bg-primary text-secondary border-primary shadow-md shadow-primary/20"
                  : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-primary/5"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tournament Grid */}
      <section className="section-spacing bg-muted/30">
        <div className="container-max">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-red-300">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold mb-2">Error Loading Tournaments</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : filteredTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => {
                // Get the primary sport from events
                const primarySport = tournament.events?.[0]?.sport || "Tournament"

                return (
                  <TournamentCard
                    key={tournament.id}
                    id={tournament.id}
                    title={tournament.name}
                    image="/tournament-placeholder.png"
                    location={tournament.location}
                    date={`${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`}
                    category={tournament.events?.length ? `${tournament.events.length} Events` : "Open"}
                    participants={0}
                  />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">No tournaments found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
              <Button
                variant="link"
                onClick={() => { setSearchTerm(""); setSelectedCategory("All") }}
                className="mt-2 text-primary"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}