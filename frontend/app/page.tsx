"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { StatCard } from "@/components/stat-card"
import { TournamentCard } from "@/components/tournament-card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Zap, BarChart3, ArrowRight, Star } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const sports = [
  { icon: "🏸", name: "Badminton" },
  { icon: "🏀", name: "Basketball" },
  { icon: "🏏", name: "Cricket" },
  { icon: "⚽", name: "Football" },
  { icon: "♟️", name: "Chess" },
  { icon: "🎾", name: "Pickleball" },
]

const tournaments = [
  {
    id: "1",
    title: "Elite Badminton Championship",
    image: "/badminton-tournament.jpg",
    location: "Mumbai, India",
    date: "Dec 15-20, 2024",
    category: "Pro",
    participants: 128,
  },
  {
    id: "2",
    title: "Basketball National Cup",
    image: "/basketball-tournament.jpg",
    location: "Delhi, India",
    date: "Dec 22-28, 2024",
    category: "Semi-Pro",
    participants: 64,
  },
  {
    id: "3",
    title: "Chess Open Tournament",
    image: "/chess-tournament.png",
    location: "Bangalore, India",
    date: "Dec 25-27, 2024",
    category: "Open",
    participants: 256,
  },
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
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary to-neutral-900">
        <div className="absolute inset-0 opacity-20">
          <Image src="/sports-arena-badminton.jpg" alt="Background" fill className="object-cover" />
        </div>

        <div className="relative container-max py-32 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
            Smart Tournaments.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">Real-Time Results.</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            A professional tournament experience for clubs, players, and organizers. Manage matches, track results, and
            connect with athletes globally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/tournaments">Create Profile</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white text-white hover:bg-white/10 bg-transparent"
            >
              <Link href="/host">Host Tournament</Link>
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {sports.map((sport) => (
              <div
                key={sport.name}
                className="p-6 bg-card rounded-lg border border-border text-center cursor-pointer glow-primary group"
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">{sport.icon}</div>
                <p className="font-semibold text-sm">{sport.name}</p>
              </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} {...tournament} />
            ))}
          </div>
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
                <div key={feature.title} className="p-8 bg-card rounded-lg border border-border glow-primary">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary text-white section-spacing">
        <div className="container-max text-center">
          <h2 className="text-white mb-6">Ready to Transform Your Tournament Experience?</h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of athletes, clubs, and organizers already using xSPRINT to power their tournaments
          </p>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="border-primary text-primary hover:bg-primary/10 bg-transparent"
          >
            <Link href="/register">Get Started Today</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  )
}
