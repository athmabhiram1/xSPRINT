"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Medal } from "lucide-react"

const leaderboardData = [
  { rank: 1, name: "Saina Nehwal", club: "Mumbai Sports", wins: 12, losses: 1, points: 1840 },
  { rank: 2, name: "PV Sindhu", club: "Hyderabad Champs", wins: 11, losses: 2, points: 1780 },
  { rank: 3, name: "Kidambi Srikanth", club: "Bangalore Rackets", wins: 10, losses: 3, points: 1690 },
  { rank: 4, name: "Jwala Gutta", club: "Delhi Elite", wins: 9, losses: 4, points: 1620 },
  { rank: 5, name: "Ashwini Ponnappa", club: "Chennai Pro", wins: 8, losses: 5, points: 1540 },
]

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container-max py-16">
        <div className="mb-8">
          <h1 className="mb-2">Live Leaderboard</h1>
          <p className="text-muted-foreground">Top performers in current tournaments</p>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="p-4 text-left font-semibold">Rank</th>
                  <th className="p-4 text-left font-semibold">Player</th>
                  <th className="p-4 text-left font-semibold">Club</th>
                  <th className="p-4 text-center font-semibold">Wins</th>
                  <th className="p-4 text-center font-semibold">Losses</th>
                  <th className="p-4 text-right font-semibold">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.map((player) => (
                  <tr key={player.rank} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {player.rank <= 3 && <Medal className="text-primary" size={20} />}
                        <span className="font-bold text-lg">{player.rank}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold">{player.name}</td>
                    <td className="p-4 text-muted-foreground">{player.club}</td>
                    <td className="p-4 text-center text-green-600 font-semibold">{player.wins}</td>
                    <td className="p-4 text-center text-red-600 font-semibold">{player.losses}</td>
                    <td className="p-4 text-right">
                      <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-full">
                        {player.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
