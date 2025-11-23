"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { Lock, CheckCircle, Loader2, AlertCircle, MapPin, Play } from "lucide-react"
import { validateMatchCode, submitMatchResult, Match, apiGet } from "@/lib/apiClient" // Updated import

export default function UmpirePage() {
  const [view, setView] = useState<'LIST' | 'UNLOCK' | 'CONTROL'>('LIST')
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  
  const [matchCode, setMatchCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Score tracking
  const [sets, setSets] = useState<Array<{ a: number; b: number }>>([{ a: 0, b: 0 }])
  const [currentSet, setCurrentSet] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
      fetchMatches();
  }, []);

  const fetchMatches = async () => {
      try {
          // Fetch matches relevant for umpire (e.g., scheduled or ongoing)
          const data = await apiGet<Match[]>('/api/matches?status=SCHEDULED,ONGOING');
          setMatches(data || []);
      } catch (err) {
          console.error("Failed to fetch matches", err);
      }
  };

  const handleSelectMatch = (match: Match) => {
      setSelectedMatch(match);
      setView('UNLOCK');
      setError("");
      setMatchCode("");
  };

  const handleUnlock = async () => {
    if (!selectedMatch || !matchCode) {
      setError("Please enter the match code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await validateMatchCode(selectedMatch.id, matchCode)
      if (response.success && response.match) {
        setSelectedMatch(response.match) // Update with full details if needed
        setView('CONTROL')
      } else {
        setError("Invalid match code")
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
    if (!selectedMatch) return

    // Determine winner based on sets won
    const setsWonA = sets.filter(set => set.a > set.b).length
    const setsWonB = sets.filter(set => set.b > set.a).length

    const winnerId = setsWonA > setsWonB ? selectedMatch.playerAId : selectedMatch.playerBId

    if (!winnerId) {
      setError("Cannot determine winner. Please ensure all sets are completed.")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const response = await submitMatchResult({
        matchId: selectedMatch.id,
        code: matchCode,
        score: { sets },
        winnerId
      })

      if (response.success) {
        alert("Match result submitted successfully!")
        // Reset form
        setView('LIST')
        setSelectedMatch(null)
        setMatchCode("")
        setSets([{ a: 0, b: 0 }])
        setCurrentSet(0)
        fetchMatches(); // Refresh list
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

      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="mb-8">
            <h1 className="text-4xl font-black text-slate-900 mb-2">Umpire Console</h1>
            <p className="text-muted-foreground">Manage live matches and scoring</p>
        </div>

        {view === 'LIST' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {matches.map((match) => (
                    <div key={match.id} onClick={() => handleSelectMatch(match)} className="bg-card p-8 rounded-3xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
                        <div className="flex justify-between items-center mb-6">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${match.status === 'ONGOING' ? 'bg-emerald-100 text-emerald-700 animate-pulse' : 'bg-slate-100 text-slate-600'}`}>
                                {match.status}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">#{match.id.slice(0, 6).toUpperCase()}</span>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg">{match.playerA?.name || 'TBD'}</span>
                            </div>
                            <div className="text-center text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">VS</div>
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-lg">{match.playerB?.name || 'TBD'}</span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-muted p-3 rounded-xl">
                            <MapPin className="w-4 h-4 text-emerald-500" /> 
                            {match.courtId || 'Unassigned'}
                        </div>
                    </div>
                ))}
                {matches.length === 0 && (
                    <div className="col-span-full bg-card rounded-3xl p-12 text-center border border-dashed border-border">
                        <p className="text-muted-foreground font-medium text-lg">No active matches found.</p>
                    </div>
                )}
            </div>
        )}

        {view === 'UNLOCK' && (
            <div className="max-w-md mx-auto bg-card rounded-lg border border-border p-8 space-y-6">
                <div className="text-center mb-4">
                    <h3 className="font-bold text-xl">Unlock Match</h3>
                    <p className="text-sm text-muted-foreground">{selectedMatch?.playerA?.name} vs {selectedMatch?.playerB?.name}</p>
                </div>
                
                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="text-destructive mt-0.5" size={20} />
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

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

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setView('LIST')}>Cancel</Button>
                    <Button className="flex-1" onClick={handleUnlock} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 animate-spin" size={20} /> : "Unlock"}
                    </Button>
                </div>
            </div>
        )}

        {view === 'CONTROL' && selectedMatch && (
            <div className="max-w-3xl mx-auto bg-card rounded-lg border border-border p-8 space-y-8">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="text-destructive mt-0.5" size={20} />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Match Info */}
              <div className="bg-muted rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-heading font-bold">Match Control</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">Set {currentSet + 1}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Player A</p>
                    <p className="font-semibold">{selectedMatch.playerA?.name || "TBD"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Player B</p>
                    <p className="font-semibold">{selectedMatch.playerB?.name || "TBD"}</p>
                  </div>
                </div>
              </div>

              {/* Scoreboard */}
              <div className="grid grid-cols-2 gap-6">
                {[
                  { name: selectedMatch.playerA?.name || "Player A", score: sets[currentSet].a, player: 'a' as const },
                  { name: selectedMatch.playerB?.name || "Player B", score: sets[currentSet].b, player: 'b' as const },
                ].map((player, idx) => (
                  <div key={idx} className="space-y-4">
                    <div>
                      <p className="font-semibold text-sm">{player.name}</p>
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
                  onClick={() => setView('LIST')}
                >
                  Back to List
                </Button>
              </div>
            </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
