"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { BracketMatchCard } from "@/components/bracket-match-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { getTournaments, getEventsByTournament, getFixturesByEvent, Tournament, Event, Match, formatMatchTime, getRoundName } from "@/lib/api"
import { Loader2, RefreshCw, Filter } from "lucide-react"

export default function FixturesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("")
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [fixtures, setFixtures] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingFixtures, setLoadingFixtures] = useState(false)
  const [statusFilter, setStatusFilter] = useState("ALL")

  // Fetch Tournaments on Load
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await getTournaments()
        if (data?.success && data?.tournaments) {
          setTournaments(data.tournaments)
          if (data.tournaments.length > 0) {
            setSelectedTournamentId(data.tournaments[0].id)
          }
        } else {
          // Handle empty or failed response
          setTournaments([])
        }
      } catch (error) {
        console.error("Failed to fetch tournaments", error)
        setTournaments([])
      } finally {
        setLoading(false)
      }
    }
    fetchTournaments()
  }, [])

  // Fetch Events when Tournament Changes
  useEffect(() => {
    if (!selectedTournamentId) return

    const fetchEvents = async () => {
      try {
        const data = await getEventsByTournament(selectedTournamentId)
        // Backend now returns { success: true, events: [...] } via api.ts normalization
        const eventsList = data?.events ?? []
        setEvents(eventsList)
        if (eventsList.length > 0) {
          setSelectedEventId(eventsList[0].id)
        } else {
          setSelectedEventId("")
          setFixtures(null)
        }
      } catch (error) {
        console.error("Failed to fetch events", error)
        setEvents([])
        setSelectedEventId("")
        setFixtures(null)
      }
    }
    fetchEvents()
  }, [selectedTournamentId])

  // Fetch Fixtures when Event Changes
  useEffect(() => {
    if (!selectedEventId) return

    fetchFixtures()
  }, [selectedEventId])

  const fetchFixtures = async () => {
    setLoadingFixtures(true)
    try {
      const data = await getFixturesByEvent(selectedEventId)
      if (data?.success && data?.data) {
        setFixtures(data.data)
      } else {
        setFixtures(null)
      }
    } catch (error) {
      console.error("Failed to fetch fixtures", error)
      setFixtures(null)
    } finally {
      setLoadingFixtures(false)
    }
  }

  const selectedEvent = events.find(e => e.id === selectedEventId)
  const matches = fixtures?.flatMatches || []
  
  // Filter matches by status
  const filteredMatches = statusFilter === "ALL" 
    ? matches 
    : matches.filter((m: Match) => m.status === statusFilter)

  // Group fixtures by round
  const rounds = filteredMatches.reduce((acc: any, match: Match) => {
    if (!acc[match.round]) {
      acc[match.round] = []
    }
    acc[match.round].push(match)
    return acc
  }, {})

  const sortedRounds = Object.entries(rounds).sort((a: any, b: any) => a[0] - b[0])

  const statusCounts = fixtures?.statusCounts || { pending: 0, scheduled: 0, completed: 0 }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container-max py-16">
        <div className="mb-8">
          <h1 className="mb-2">Tournament Fixtures</h1>
          <p className="text-muted-foreground">View matches, results, and live scores</p>
        </div>

        {/* Tournament Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Select Tournament</label>
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Filter by Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Matches</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="ONGOING">Live</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Event Stats */}
        {selectedEvent && fixtures && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Total Matches</p>
              <p className="text-2xl font-bold">{fixtures.totalMatches || 0}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
            </div>
            <div className="bg-card rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground mb-1">Format</p>
              <Badge variant="secondary">{selectedEvent.type}</Badge>
            </div>
          </div>
        )}

        {/* Event Selector */}
        {events.length > 0 ? (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {events.map(event => (
              <Button
                key={event.id}
                variant={selectedEventId === event.id ? "default" : "outline"}
                onClick={() => setSelectedEventId(event.id)}
              >
                {event.name}
              </Button>
            ))}
            <Button variant="ghost" size="icon" onClick={() => fetchFixtures()}>
              <RefreshCw size={16} />
            </Button>
          </div>
        ) : (
          <div className="mb-8 text-muted-foreground">No events found for this tournament.</div>
        )}

        {/* Bracket */}
        {loading || loadingFixtures ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="space-y-12">
            {sortedRounds.map(([round, roundMatches]: [string, any]) => {
              const roundNum = parseInt(round)
              const roundName = getRoundName(roundNum, fixtures.totalRounds || 1)
              
              return (
                <div key={round}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-heading font-bold text-lg">{roundName}</h3>
                    <Badge variant="outline">{roundMatches.length} matches</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roundMatches.map((match: Match) => (
                      <BracketMatchCard
                        key={match.id}
                        playerA={match.playerA?.name || "TBD"}
                        clubA={match.playerA?.club?.name || "-"}
                        playerB={match.playerB?.name || "TBD"}
                        clubB={match.playerB?.club?.name || "-"}
                        court={match.schedule?.court?.name || "TBD"}
                        time={formatMatchTime(match.startTime || null)}
                        status={match.status.toLowerCase() as any}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <p className="text-muted-foreground">
              {statusFilter !== "ALL" 
                ? `No ${statusFilter.toLowerCase()} matches found` 
                : "No fixtures generated yet"}
            </p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
