"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { StatCard } from "@/components/stat-card"
import { TournamentCard } from "@/components/tournament-card"
import { AIInsights } from "@/components/ai-insights"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Zap, BarChart3, ArrowRight, Star, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getTournaments, formatDate } from "@/lib/api"
import type { Tournament } from "@/lib/api"

const sports = [
  { name: "Badminton", image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=800&auto=format&fit=crop" },
  { name: "Basketball", image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800&auto=format&fit=crop" },
  { name: "Cricket", image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=800&auto=format&fit=crop" },
  { name: "Football", image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800&auto=format&fit=crop" },
  { name: "Tennis", image: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop" },
  { name: "Volleyball", image: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=800&auto=format&fit=crop" },
  { name: "Table Tennis", image: "/table-tennis.jpg" },
  { name: "Swimming", image: "https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop" },
  { name: "Athletics", image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop" },
  { name: "Hockey", image: "https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?q=80&w=800&auto=format&fit=crop" },
  { name: "Chess", image: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=800&auto=format&fit=crop" },
  { name: "Pickleball", image: "/pickleball-tournament.png" },
]

const features = [
  {
    title: "Verified Tournaments",
    description: "Trusted by clubs and organizers worldwide",
    icon: Trophy,
  },
  {
    title: "Fast Registration",
    description: "Register in minutes, start playing instantly",
    icon: Zap,
  },
  {
    title: "Real-Time Results",
    description: "Live leaderboards and instant match updates",
    icon: BarChart3,
  },
  {
    title: "Player Analytics",
    description: "Track your performance and improve your game",
    icon: Users,
  },
]

export default function Home() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [demoTournamentId, setDemoTournamentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch tournaments from backend
    const fetchTournaments = async () => {
      try {
        const data = await getTournaments({ includeEvents: true, includeCourts: true, includeRegistrations: true })
        if (data.success) {
          setTournaments(data.tournaments || [])
          if (data.tournaments && data.tournaments.length > 0) {
            setDemoTournamentId(data.tournaments[0].id)
          }
        } else {
          setError(data.error || "Failed to fetch tournaments")
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch tournaments")
        console.error("Failed to fetch tournaments", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTournaments()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section with Animated Gradient */}
      <section className="relative overflow-hidden gradient-primary">
        {/* Animated gradient mesh background */}
        <div className="absolute inset-0 gradient-mesh opacity-30 animate-pulse-slow" />

        {/* Background image overlay */}
        <div className="absolute inset-0 opacity-10">
          <img src="/sports-arena-badminton.jpg" alt="Background" className="w-full h-full object-cover" />
        </div>

        <div className="relative container-max py-32 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight animate-fade-in">
            Smart Tournaments.
            <br />
            <span className="text-gradient-accent">Real-Time Results.</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto animate-slide-up">
            A professional tournament experience for clubs, players, and organizers. Manage matches, track results, and
            connect with athletes globally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Button size="lg" asChild className="glow-accent">
              <Link href="/register">Create Profile</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="glass border-white/30 text-white hover:bg-white/20"
            >
              <Link href="/admin">Host Tournament</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-background py-12 border-b border-border">
        <div className="container-max grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard icon={Trophy} label="Tournaments" value="100+" />
          <StatCard icon={Users} label="Clubs" value="300+" />
          <StatCard icon={Star} label="Players" value="2000+" />
        </div>
      </section>

      {/* Discover Sports */}
      <section className="section-spacing bg-background">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="mb-4">Discover Sports</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from a wide variety of sports and find tournaments that match your skill level
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {sports.map((sport) => (
              <Link
                href={`/tournaments?sport=${encodeURIComponent(sport.name)}`}
                key={sport.name}
                className="card-3d group relative block h-40 overflow-hidden rounded-xl bg-muted glow-primary"
              >
                <Image
                  src={sport.image}
                  alt={sport.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                  <p className="font-bold text-lg text-white drop-shadow-md transform translate-y-1 group-hover:translate-y-0 transition-transform">{sport.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tournament Showcase */}
      <section className="section-spacing bg-muted">
        <div className="container-max">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="mb-2">Featured Tournaments</h2>
              <p className="text-muted-foreground">Join upcoming tournaments and compete</p>
            </div>
            <Link
              href="/tournaments"
              className="flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
            >
              View All <ArrowRight size={20} />
            </Link>
          </div>

          {/* Loading / Error handling */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-red-300">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold mb-2">Error Loading Tournaments</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : tournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => {
                // Calculate total participants across all events
                const participantCount = tournament.events?.reduce((total, event: any) => {
                  return total + (event._count?.registrations || event.registrations?.length || 0)
                }, 0) || 0

                // Get sport-specific image
                const getTournamentImage = (t: Tournament) => {
                  if (t.image) return t.image;
                  const sport = t.events?.[0]?.sport?.toUpperCase();

                  // Use high-quality Unsplash images for sports
                  if (sport === 'BADMINTON') return '/badminton-tournament.jpg';
                  if (sport === 'BASKETBALL') return '/basketball-tournament.jpg';
                  if (sport === 'CRICKET') return '/cricket-tournament-premier.jpg';
                  if (sport === 'FOOTBALL') return '/football-tournament-championship.jpg';
                  if (sport === 'CHESS') return '/chess-tournament.png';
                  if (sport === 'PICKLEBALL') return '/pickleball-tournament.png';

                  // New sports with Unsplash URLs
                  if (sport === 'TENNIS') return 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=800&auto=format&fit=crop';
                  if (sport === 'VOLLEYBALL') return 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?q=80&w=800&auto=format&fit=crop';
                  if (sport === 'SWIMMING') return 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=800&auto=format&fit=crop';
                  if (sport === 'TABLE TENNIS') return '/table-tennis.jpg';
                  if (sport === 'ATHLETICS') return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=800&auto=format&fit=crop';
                  if (sport === 'HOCKEY') return 'https://images.unsplash.com/photo-1580748141549-71748dbe0bdc?q=80&w=800&auto=format&fit=crop';

                  return '/sports-arena-badminton.jpg';
                }

                return (
                  <TournamentCard
                    key={tournament.id}
                    id={tournament.id}
                    title={tournament.name}
                    image={getTournamentImage(tournament)}
                    location={tournament.location}
                    date={`${formatDate(tournament.startDate)} - ${formatDate(tournament.endDate)}`}
                    category={tournament.events?.length ? `${tournament.events.length} Events` : "Open"}
                    participants={participantCount}
                    status={tournament.status}
                  />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
              <div className="text-8xl mb-6 animate-bounce">🏆</div>
              <h3 className="text-2xl font-bold mb-3">No Tournaments Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Be the first to create a tournament and start competing!
              </p>
              <Button size="lg" asChild>
                <Link href="/admin">Create Tournament</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-spacing bg-background">
        <div className="container-max">
          <div className="text-center mb-12">
            <h2 className="mb-4">Why Choose xSPRINT</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for the modern competitive athlete and tournament organizer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="glass-card card-3d glow-primary">
                  <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4 animate-float">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="gradient-secondary text-white section-spacing relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-20" />
        <div className="container-max text-center relative">
          <h2 className="text-white mb-6">Ready to Transform Your Tournament Experience?</h2>
          <p className="text-white/90 mb-8 max-w-2xl mx-auto text-lg">
            Join thousands of athletes, clubs, and organizers already using xSPRINT to power their tournaments
          </p>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="glass border-white/30 text-white hover:bg-white/20 glow-accent"
          >
            <Link href="/register">Get Started Today</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
