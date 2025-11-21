"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TournamentCard } from "@/components/tournament-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter } from "lucide-react"
import { useState } from "react"

const mockTournaments = [
  {
    id: "1",
    title: "Elite Badminton Championship",
    image: "/badminton-championship.png",
    location: "Mumbai, India",
    date: "Dec 15-20, 2024",
    category: "Pro",
    sport: "Badminton",
    participants: 128,
  },
  {
    id: "2",
    title: "Basketball National Cup",
    image: "/basketball-tournament-national.jpg",
    location: "Delhi, India",
    date: "Dec 22-28, 2024",
    category: "Semi-Pro",
    sport: "Basketball",
    participants: 64,
  },
  {
    id: "3",
    title: "Chess Open Tournament",
    image: "/chess-tournament-competitive.jpg",
    location: "Bangalore, India",
    date: "Dec 25-27, 2024",
    category: "Open",
    sport: "Chess",
    participants: 256,
  },
  {
    id: "4",
    title: "Pickleball Summer Series",
    image: "/pickleball-tournament.png",
    location: "Chennai, India",
    date: "Jan 5-10, 2025",
    category: "Amateur",
    sport: "Pickleball",
    participants: 96,
  },
  {
    id: "5",
    title: "Cricket Premier League",
    image: "/cricket-tournament-premier.jpg",
    location: "Pune, India",
    date: "Jan 12-20, 2025",
    category: "Pro",
    sport: "Cricket",
    participants: 48,
  },
  {
    id: "6",
    title: "Football Championship",
    image: "/football-tournament-championship.jpg",
    location: "Hyderabad, India",
    date: "Jan 15-25, 2025",
    category: "Semi-Pro",
    sport: "Football",
    participants: 80,
  },
]

const categories = ["All", "Badminton", "Basketball", "Cricket", "Football", "Chess", "Pickleball"]

export default function TournamentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredTournaments = mockTournaments.filter((tournament) => {
    const matchesSearch =
      tournament.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tournament.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Fixed logic: Check if selectedCategory matches the tournament's sport
    const matchesCategory = selectedCategory === "All" || tournament.sport === selectedCategory
    
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
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  selectedCategory === cat 
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
          {filteredTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} {...tournament} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">No tournaments found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
              <Button 
                variant="link" 
                onClick={() => {setSearchTerm(""); setSelectedCategory("All")}}
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