"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { getTournaments, getEventsByTournament, getFixturesByEvent, Tournament, Event, Match, formatMatchTime, formatDate } from "@/lib/api"
import { Loader2, Clock, MapPin, Calendar } from "lucide-react"

export default function SchedulePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("")
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(false)

  // Fetch Tournaments on Load
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await getTournaments()
        if (data.success && data.tournaments) {
          setTournaments(data.tournaments)
          if (data.tournaments.length > 0) {
            setSelectedTournamentId(data.tournaments[0].id)
          }
        }
      } catch (error) {
        console.error("Failed to fetch tournaments", error)
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
        if (data.success && data.events) {
          setEvents(data.events)
          if (data.events.length > 0) {
            setSelectedEventId(data.events[0].id)
          } else {
            setSelectedEventId("")
            setMatches([])
          }
        }
      } catch (error) {
        console.error("Failed to fetch events", error)
      }
    }
    fetchEvents()
  }, [selectedTournamentId])

  // Fetch Matches when Event Changes
  useEffect(() => {
    if (!selectedEventId) return

    const fetchMatches = async () => {
      setLoadingMatches(true)
      try {
        const data = await getFixturesByEvent(selectedEventId)
        if (data.success && data.flatMatches) {
          // Filter only scheduled matches
          const scheduledMatches = data.flatMatches.filter((m: Match) =>
            m.status === 'SCHEDULED' || m.status === 'ONGOING' || m.status === 'COMPLETED'
          )
          setMatches(scheduledMatches)
        } else {
          setMatches([])
        }
      } catch (error) {
        console.error("Failed to fetch matches", error)
      } finally {
        setLoadingMatches(false)
      }
    }
    fetchMatches()
  }, [selectedEventId])

  // Group matches by date and court for grid display
  const groupedByDate = matches.reduce((acc, match) => {
    if (!match.startTime) return acc

    const date = formatDate(match.startTime)
    if (!acc[date]) acc[date] = []
    acc[date].push(match)
    return acc
  }, {} as Record<string, Match[]>)

  // Get all unique courts
  const courts = Array.from(new Set(matches.map(m => m.schedule?.court?.name).filter(Boolean))) as string[]

  // Get all unique time slots for a given date
  const getTimeSlots = (dateMatches: Match[]) => {
    const times = dateMatches
      .map(m => m.startTime)
      .filter(Boolean)
      .sort((a, b) => new Date(a!).getTime() - new Date(b!).getTime())

    return Array.from(new Set(times.map(t => formatMatchTime(t))))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container-max py-16">
        <div className="mb-8">
          <h1 className="mb-2">Court Schedule</h1>
          <p className="text-muted-foreground">Multi-court tournament schedule with timeline view</p>
        </div>

        {/* Tournament & Event Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
            <label className="block text-sm font-medium mb-2 text-muted-foreground">Select Event</label>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map(e => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Schedule Grid */}
        {loading || loadingMatches ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedByDate).map(([date, dateMatches]) => {
              const timeSlots = getTimeSlots(dateMatches)

              return (
                <div key={date} className="bg-card rounded-xl border border-border overflow-hidden">
                  {/* Date Header */}
                  <div className="bg-primary/10 p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Calendar className="text-primary" size={20} />
                      <h2 className="font-heading font-bold text-xl">{date}</h2>
                    </div>
                  </div>

                  {/* Schedule Grid */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[600px]">
                      {/* Grid Header */}
                      <div className="grid gap-2 p-4 bg-muted border-b border-border" style={{ gridTemplateColumns: `120px repeat(${courts.length}, 1fr)` }}>
                        <div className="font-semibold text-sm">Time</div>
                        {courts.map((court) => (
                          <div key={court} className="font-semibold text-sm text-center">
                            <div className="flex items-center justify-center gap-1">
                              <MapPin size={14} className="text-primary" />
                              {court}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Time Slots */}
                      <div className="p-4 space-y-2">
                        {timeSlots.map((timeSlot) => {
                          const matchesAtTime = dateMatches.filter(m => formatMatchTime(m.startTime) === timeSlot)

                          return (
                            <div key={timeSlot} className="grid gap-2" style={{ gridTemplateColumns: `120px repeat(${courts.length}, 1fr)` }}>
                              {/* Time Label */}
                              <div className="flex items-center gap-2 font-semibold text-sm bg-muted rounded px-3 py-2">
                                <Clock size={14} className="text-muted-foreground" />
                                {timeSlot}
                              </div>

                              {/* Court Cells */}
                              {courts.map((court) => {
                                const match = matchesAtTime.find(m => m.schedule?.court?.name === court)

                                return (
                                  <div
                                    key={`${timeSlot}-${court}`}
                                    className={`text-sm rounded border transition-all ${match
                                        ? match.status === 'ONGOING'
                                          ? 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700 animate-pulse'
                                          : match.status === 'COMPLETED'
                                            ? 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700'
                                            : 'bg-primary/10 border-primary/30 hover:bg-primary/20'
                                        : 'bg-muted border-border'
                                      } p-2`}
                                  >
                                    {match ? (
                                      <div className="space-y-1">
                                        <div className="font-semibold text-xs truncate">
                                          {match.playerA?.name || "TBD"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">vs</div>
                                        <div className="font-semibold text-xs truncate">
                                          {match.playerB?.name || "TBD"}
                                        </div>
                                        {match.status === 'ONGOING' && (
                                          <div className="text-xs font-bold text-green-600 dark:text-green-400">LIVE</div>
                                        )}
                                        {match.status === 'COMPLETED' && match.winnerId && (
                                          <div className="text-xs font-bold text-primary">
                                            Winner: {match.winnerId === match.playerAId ? match.playerA?.name : match.playerB?.name}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-center text-muted-foreground text-xs">-</div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-xl bg-card">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-muted-foreground">No scheduled matches yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Generate fixtures and schedule matches from the admin panel.
            </p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
