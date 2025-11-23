"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Lock, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { validateMatchCode, submitMatchResult, Match } from "@/lib/api"

export default function UmpirePage() {
  const [matchCode, setMatchCode] = useState("")
  const [matchId, setMatchId] = useState("")
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Score tracking
  const [sets, setSets] = useState<Array<{ a: number; b: number }>>([{ a: 0, b: 0 }])
  const [currentSet, setCurrentSet] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const handleUnlock = async () => {
    if (!matchId || !matchCode) {
      setError("Please enter both Match ID and Match Code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await validateMatchCode(matchId, matchCode)
      if (response.success && response.match) {
        setMatch(response.match)
        setIsUnlocked(true)
      } else {
        setError("Invalid match code or match not found")
      }
    } catch (err: any) {
      setError(err.message || "Failed to validate match code")
    } finally {
      setLoading(false)
    }
  }

  const updateScore = (player: 'a' | 'b', delta: number) => {
    const newSets = [...sets]
    newSets[currentSet][player] = Math.max(0, newSets[currentSet][player] + delta)
    setSets(newSets)
  }

  const handleNextSet = () => {
    setSets([...sets, { a: 0, b: 0 }])
    setCurrentSet(currentSet + 1)
  }

  const handleSubmit = async () => {
    if (!match) return

    // Determine winner based on sets won
    const setsWonA = sets.filter(set => set.a > set.b).length
    const setsWonB = sets.filter(set => set.b > set.a).length

    const winnerId = setsWonA > setsWonB ? match.playerAId : match.playerBId

    if (!winnerId) {
      setError("Cannot determine winner. Please ensure all sets are completed.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await submitMatchResult({
        matchId: match.id,
        code: matchCode,
        score: { sets },
        winnerId
      })

      if (response.success) {
        alert("Match result submitted successfully!")
        // Reset form
        setIsUnlocked(false)
        setMatchCode("")
        setMatchId("")
        setMatch(null)
        setSets([{ a: 0, b: 0 }])
        setCurrentSet(0)
      } else {
        setError("Failed to submit match result")
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit match result")
    } finally {
      setSubmitting(false)
    }
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
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-destructive mt-0.5" size={20} />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-3">Match ID</label>
                <Input
                  type="text"
                  placeholder="Enter Match ID"
                  className="text-center font-mono"
                  value={matchId}
                  onChange={(e) => setMatchId(e.target.value)}
                />
              </div>

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
                    onChange={(e) => setMatchCode(e.target.value)}
                  />
                </div>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleUnlock}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" size={20} />
                    Validating...
                  </>
                ) : (
                  "Unlock Match"
                )}
              </Button>
            </div>
          ) : (
            // Scoring Panel
            <div className="bg-card rounded-lg border border-border p-8 space-y-8">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-destructive mt-0.5" size={20} />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Match Info */}
              <div className="bg-muted rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-heading font-bold">Match Details</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">Set {currentSet + 1}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Player A</p>
                    <p className="font-semibold">{match?.playerA?.name || "TBD"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Club A</p>
                    <p className="font-semibold">{match?.playerA?.club?.name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Player B</p>
                    <p className="font-semibold">{match?.playerB?.name || "TBD"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Club B</p>
                    <p className="font-semibold">{match?.playerB?.club?.name || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Set History */}
              {sets.length > 1 && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-semibold mb-2">Previous Sets</p>
                  <div className="flex gap-2">
                    {sets.slice(0, -1).map((set, idx) => (
                      <div key={idx} className="bg-background rounded px-3 py-1 text-sm font-mono">
                        Set {idx + 1}: {set.a} - {set.b}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scoreboard */}
              <div className="grid grid-cols-2 gap-6">
                {[
                  { name: match?.playerA?.name || "Player A", club: match?.playerA?.club?.name || "-", score: sets[currentSet].a, player: 'a' as const },
                  { name: match?.playerB?.name || "Player B", club: match?.playerB?.club?.name || "-", score: sets[currentSet].b, player: 'b' as const },
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
                        onClick={() => updateScore(player.player, -1)}
                      >
                        -1
                      </Button>
                      <Button
                        className="flex-[2] text-xl shadow-lg"
                        onClick={() => updateScore(player.player, 1)}
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
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 animate-spin" size={20} />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} className="mr-2" />
                        End Match
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => {
                    setIsUnlocked(false)
                    setMatchCode("")
                    setMatchId("")
                    setMatch(null)
                    setSets([{ a: 0, b: 0 }])
                    setCurrentSet(0)
                    setError("")
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
