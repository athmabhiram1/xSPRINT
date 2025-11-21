"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Lock, Plus, Minus, CheckCircle } from "lucide-react"

export default function UmpirePage() {
  const [matchCode, setMatchCode] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [currentSet, setCurrentSet] = useState(1)

  const handleUnlock = () => {
    if (matchCode === "123456") {
      setIsUnlocked(true)
    }
  }

  const handleSubmit = () => {
    alert(`Match result submitted: ${scoreA} - ${scoreB}`)
  }

  const handleNextSet = () => {
    setScoreA(0)
    setScoreB(0)
    setCurrentSet(currentSet + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container-max py-16">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="mb-2">Umpire Panel</h1>
            <p className="text-muted-foreground">Enter your match code to manage live scoring</p>
          </div>

          {!isUnlocked ? (
            // Match Code Input Screen
            <div className="bg-card rounded-lg border border-border p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3">Match Code</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="pl-10 text-center text-2xl font-mono tracking-widest"
                    value={matchCode}
                    onChange={(e) => setMatchCode(e.target.value.toUpperCase())}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Demo code: 123456</p>
              </div>

              <Button size="lg" className="w-full" onClick={handleUnlock}>
                Unlock Match
              </Button>
            </div>
          ) : (
            // Scoring Panel
            <div className="bg-card rounded-lg border border-border p-8 space-y-8">
              {/* Match Info */}
              <div className="bg-muted rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-heading font-bold">Match Details</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">Set {currentSet}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Player A</p>
                    <p className="font-semibold">Saina Nehwal</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Club A</p>
                    <p className="font-semibold">Mumbai Sports</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Player B</p>
                    <p className="font-semibold">PV Sindhu</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Club B</p>
                    <p className="font-semibold">Delhi Elite</p>
                  </div>
                </div>
              </div>

              {/* Scoreboard */}
              <div className="grid grid-cols-2 gap-6">
                {[
                  { name: "Saina Nehwal", club: "Mumbai", score: scoreA, setScore: setScoreA },
                  { name: "PV Sindhu", club: "Delhi", score: scoreB, setScore: setScoreB },
                ].map((player, idx) => (
                  <div key={idx} className="space-y-4">
                    <div>
                      <p className="font-semibold text-sm">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.club}</p>
                    </div>

                    <div className="bg-primary/10 rounded-lg p-6 text-center">
                      <p className="text-6xl font-bold font-mono text-primary">{player.score}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 bg-transparent text-xl"
                        onClick={() => player.setScore(Math.max(0, player.score - 1))}
                      >
                        -1
                      </Button>
                      <Button 
                        className="flex-[2] text-xl shadow-lg" 
                        onClick={() => player.setScore(player.score + 1)}
                      >
                        +1
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="bg-transparent" 
                    onClick={handleNextSet}
                  >
                    Next Set
                  </Button>
                  <Button onClick={handleSubmit}>
                    <CheckCircle size={20} className="mr-2" />
                    End Match
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setIsUnlocked(false)
                    setMatchCode("")
                    setScoreA(0)
                    setScoreB(0)
                    setCurrentSet(1)
                  }}
                >
                  Back to Code Entry
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
