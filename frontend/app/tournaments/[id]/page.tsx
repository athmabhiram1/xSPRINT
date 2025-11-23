"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Users, Trophy, CheckCircle2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useParams } from "next/navigation"
import { getTournament, Tournament, Event, formatDate, registerPlayerToEvent } from "@/lib/api"
import { FixtureGenerator } from "@/components/fixture-generator"
import { ScheduleGenerator } from "@/components/schedule-generator"

const tabs = ["Overview", "Fixtures", "Schedule", "Results"]

export default function TournamentDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState("Overview")
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)
  const { toast } = useToast()

  // Registration Form State
  const [playerName, setPlayerName] = useState("")
  const [playerEmail, setPlayerEmail] = useState("")
  const [playerGender, setPlayerGender] = useState("Male")
  const [selectedEventId, setSelectedEventId] = useState("")

  const fetchTournamentDetails = async () => {
    try {
      setLoading(true)
      const data = await getTournament(id)
      if (data.success && data.tournament) {
        setTournament(data.tournament)
        if (data.tournament.events && data.tournament.events.length > 0) {
          setSelectedEventId(data.tournament.events[0].id)
        }
      } else {
        setError(data.error || "Failed to load tournament details")
      }
    } catch (err: any) {
      setError(err.message || "Failed to load tournament details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchTournamentDetails()
    }
  }, [id])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId) {
      toast({ title: "Error", description: "Please select an event", variant: "destructive" })
      return
    }

    setIsRegistering(true)

    try {
      // 1. Create Player (Simplified for this demo - normally would be separate or auth-based)
      // For now, we'll assume the API handles player creation or we'd need a separate call.
      // The current API client has registerPlayerToEvent which takes playerId.
      // We need a flow to create player first.

      // Let's use a direct call to create player first
      const playerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, email: playerEmail, gender: playerGender })
      })
      const playerData = await playerRes.json()

      if (!playerData.success) throw new Error(playerData.error || "Failed to create player profile")

      const playerId = playerData.data.id

      // 2. Register to Event
      const regRes = await registerPlayerToEvent({ eventId: selectedEventId, playerId })

      if (regRes.success) {
        setRegistered(true)
        toast({
          title: "Registration Successful!",
          description: `You have been registered for the tournament.`,
        })
      } else {
        throw new Error(regRes.error || "Registration failed")
      }
    } catch (err: any) {
      toast({
        title: "Registration Failed",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setIsRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
        <p className="text-muted-foreground mb-4">{error || "The requested tournament could not be loaded."}</p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header with Image */}
      <section className="relative h-96 overflow-hidden bg-muted">
        <Image
          src={tournament.image || "/tournament-placeholder.png"}
          alt={tournament.name}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

        <div className="absolute bottom-0 left-0 right-0 p-8 container-max">
          <div className="flex gap-2 mb-4">
            <span className="bg-primary text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              {new Date(tournament.endDate) > new Date() ? "Open for Registration" : "Completed"}
            </span>
            {tournament.events && tournament.events.length > 0 && (
              <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-white/30">
                {tournament.events[0].sport}
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">{tournament.name}</h1>
          <p className="text-gray-200 flex items-center gap-2 text-lg">
            <MapPin size={18} className="text-primary" /> {tournament.location}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="container-max py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="text-center border-r border-border last:border-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Date</p>
                <p className="font-bold text-sm">{formatDate(tournament.startDate)}</p>
              </div>
              <div className="text-center border-r border-border last:border-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Events</p>
                <p className="font-bold">{tournament.events?.length || 0}</p>
              </div>
              <div className="text-center border-r border-border last:border-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Courts</p>
                <p className="font-bold">{tournament.courts?.length || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                <p className="font-bold text-primary">{new Date(tournament.endDate) > new Date() ? "Active" : "Ended"}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border mb-8">
              <div className="flex gap-8 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 font-semibold transition-colors whitespace-nowrap ${activeTab === tab
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === "Overview" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <h3 className="font-heading font-bold text-xl mb-4 flex items-center gap-2">
                    <Trophy className="text-primary" size={20} /> About the Event
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Elite Badminton Championship is an annual premier tournament featuring the best players from
                    across the country. It showcases competitive spirit, athletic excellence, and the joy of badminton.
                    Hosted at the world-class Bombay Badminton Club, participants will enjoy professional-grade courts
                    and facilities.
                  </p>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-xl mb-4">Rules & Regulations</h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>Players must be registered members of affiliated clubs.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>Matches follow standard BWF scoring: Best of 3 sets, 21 points per set.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>Reporting time is 30 minutes prior to the scheduled match time.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>Non-marking shoes are mandatory.</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-xl mb-4">Prize Pool</h3>
                  <div className="bg-gradient-to-r from-muted to-card p-6 rounded-xl border border-border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                      <div className="p-4 bg-background rounded-lg shadow-sm border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Winner</p>
                        <p className="text-3xl font-bold text-primary">₹5,00,000</p>
                      </div>
                      <div className="p-4 bg-background rounded-lg shadow-sm border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Runner Up</p>
                        <p className="text-2xl font-bold">₹2,50,000</p>
                      </div>
                      <div className="p-4 bg-background rounded-lg shadow-sm border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Semi-Finalist</p>
                        <p className="text-2xl font-bold">₹1,25,000</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Fixtures" && (
              <div className="space-y-6">
                {tournament.events?.map((event: Event) => (
                  <div key={event.id} className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4">{event.name}</h3>
                    <FixtureGenerator
                      eventId={event.id}
                      eventName={event.name}
                      onSuccess={() => {
                        // Refresh tournament data
                        fetchTournamentDetails();
                      }}
                    />
                  </div>
                ))}
                {(!tournament.events || tournament.events.length === 0) && (
                  <div className="py-12 text-center border border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground">No events found. Please create an event first.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Schedule" && (
              <div className="space-y-6">
                {tournament.events?.map((event: Event) => (
                  <div key={event.id} className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4">{event.name}</h3>
                    <Button variant="outline" onClick={() => toast({ title: "Coming Soon", description: "Schedule generation from this view is being updated." })}>
                      Open Schedule Generator
                    </Button>
                    <ScheduleGenerator
                      eventId={event.id}
                      eventName={event.name}
                      onSuccess={() => {
                        // Refresh tournament data
                        fetchTournamentDetails()
                      }}
                      open={false}
                      onOpenChange={() => { }}
                    />
                  </div>
                ))}
                {(!tournament.events || tournament.events.length === 0) && (
                  <div className="py-12 text-center border border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground">No events found. Please create an event first.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Results" && (
              <div className="py-12 text-center border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">Results will be available after matches are completed.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">

              {/* Registration Card */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Entry Fee</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-foreground">₹500</span>
                    <span className="text-sm text-muted-foreground mb-1">/ player</span>
                  </div>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full font-bold text-md" disabled={registered || new Date(tournament.endDate) < new Date()}>
                      {registered ? "Registered Successfully" : new Date(tournament.endDate) < new Date() ? "Registration Closed" : "Register Now"}
                    </Button>
                  </DialogTrigger>
                  {!registered && (
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Tournament Registration</DialogTitle>
                        <DialogDescription>
                          Enter your details to register for {tournament.name}.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleRegister}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                              id="name"
                              placeholder="John Doe"
                              required
                              value={playerName}
                              onChange={(e) => setPlayerName(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="john@example.com"
                              required
                              value={playerEmail}
                              onChange={(e) => setPlayerEmail(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="gender">Gender</Label>
                            <select
                              id="gender"
                              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              value={playerGender}
                              onChange={(e) => setPlayerGender(e.target.value)}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="category">Event Category</Label>
                            <select
                              id="category"
                              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                              value={selectedEventId}
                              onChange={(e) => setSelectedEventId(e.target.value)}
                            >
                              {tournament.events?.map(event => (
                                <option key={event.id} value={event.id}>
                                  {event.name} ({event.sport} - {event.type})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isRegistering}>
                            {isRegistering ? "Processing..." : "Confirm Registration"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  )}
                </Dialog>

                <p className="text-xs text-center text-muted-foreground mt-3">
                  Registration closes on Dec 10, 2024
                </p>
              </div>

              <div className="bg-muted/50 rounded-xl p-6 space-y-4 border border-border">
                <h3 className="font-heading font-bold">Organizer</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-border">
                    <span className="font-bold text-primary">B</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Bombay Badminton Club</p>
                    <p className="text-xs text-muted-foreground">Verified Organizer</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Contact</p>
                  <p className="font-medium text-sm">contact@bbc.com</p>
                  <p className="font-medium text-sm">+91 98765 43210</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}