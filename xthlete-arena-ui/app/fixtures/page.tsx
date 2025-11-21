"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BracketMatchCard } from "@/components/bracket-match-card"
import { Button } from "@/components/ui/button"

const rounds = [
  {
    name: "Round 1",
    matches: [
      {
        id: "1",
        playerA: "Saina Nehwal",
        clubA: "Mumbai Sports",
        playerB: "Jwala Gutta",
        clubB: "Delhi Elite",
        court: "Court 1",
        time: "9:00 AM",
        status: "scheduled" as const,
      },
      {
        id: "2",
        playerA: "PV Sindhu",
        clubA: "Hyderabad Champs",
        playerB: "Kidambi Srikanth",
        clubB: "Bangalore Rackets",
        court: "Court 2",
        time: "10:00 AM",
        status: "live" as const,
      },
    ],
  },
  {
    name: "Round 2",
    matches: [
      {
        id: "3",
        playerA: "Saina Nehwal",
        clubA: "Mumbai Sports",
        playerB: "PV Sindhu",
        clubB: "Hyderabad Champs",
        court: "Court 1",
        time: "12:00 PM",
        status: "scheduled" as const,
      },
    ],
  },
]

export default function FixturesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container-max py-16">
        <div className="mb-8">
          <h1 className="mb-2">Tournament Bracket</h1>
          <p className="text-muted-foreground">Elite Badminton Championship 2024</p>
        </div>

        {/* Tournament Selector */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button variant="outline">Women's Singles</Button>
          <Button>Men's Singles</Button>
          <Button variant="outline">Doubles</Button>
          <Button variant="outline">Mixed Doubles</Button>
        </div>

        {/* Bracket */}
        <div className="space-y-12">
          {rounds.map((round, idx) => (
            <div key={idx}>
              <h3 className="font-heading font-bold text-lg mb-6">{round.name}</h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {round.matches.map((match) => (
                  <BracketMatchCard key={match.id} {...match} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
