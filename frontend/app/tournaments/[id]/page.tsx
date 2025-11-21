"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Users } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

const tabs = ["Overview", "Fixtures", "Schedule", "Results"]

export default function TournamentDetailsPage() {
  const [activeTab, setActiveTab] = useState("Overview")

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header with Image */}
      <section className="relative h-96 overflow-hidden bg-muted">
        <Image src="/tournament-badminton-arena.jpg" alt="Tournament" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </section>

      {/* Content */}
      <section className="container-max py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Title and Details */}
            <div className="mb-8">
              <h1 className="mb-4">Elite Badminton Championship 2024</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Date</p>
                  <div className="flex items-center gap-2 font-semibold">
                    <Calendar size={16} className="text-primary" />
                    Dec 15-20
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location</p>
                  <div className="flex items-center gap-2 font-semibold">
                    <MapPin size={16} className="text-primary" />
                    Mumbai
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Players</p>
                  <div className="flex items-center gap-2 font-semibold">
                    <Users size={16} className="text-primary" />
                    128
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                    Pro
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border mb-8">
              <div className="flex gap-8 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-4 font-semibold transition-colors whitespace-nowrap ${
                      activeTab === tab
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
              <div className="space-y-6">
                <div>
                  <h3 className="font-heading font-bold text-lg mb-3">About</h3>
                  <p className="text-muted-foreground mb-4">
                    The Elite Badminton Championship is an annual premier tournament featuring the best players from
                    across the country. It showcases competitive spirit, athletic excellence, and the joy of badminton.
                  </p>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-lg mb-3">Venue</h3>
                  <p className="text-muted-foreground">Bombay Badminton Club, Mumbai, Maharashtra, India</p>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-lg mb-3">Rules & Regulations</h3>
                  <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                    <li>Players must be registered members of affiliated clubs</li>
                    <li>Best of 3 sets, 21 points per set</li>
                    <li>Doping tests mandatory for winners</li>
                    <li>Tournament rules follow BWF guidelines</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-lg mb-3">Prize Pool</h3>
                  <div className="bg-muted p-6 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">1st Prize</p>
                        <p className="text-2xl font-bold text-primary">₹5,00,000</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">2nd Prize</p>
                        <p className="text-2xl font-bold">₹2,50,000</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">3rd Prize</p>
                        <p className="text-2xl font-bold">₹1,25,000</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Fixtures" && (
              <div>
                <p className="text-muted-foreground">Fixtures will be displayed here</p>
              </div>
            )}

            {activeTab === "Schedule" && (
              <div>
                <p className="text-muted-foreground">Schedule will be displayed here</p>
              </div>
            )}

            {activeTab === "Results" && (
              <div>
                <p className="text-muted-foreground">Results will be displayed here</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Button size="lg" className="w-full">
                Register Now
              </Button>
              <Button size="lg" variant="outline" className="w-full bg-transparent">
                Share Tournament
              </Button>

              <div className="bg-muted rounded-lg p-6 space-y-4">
                <h3 className="font-heading font-bold">Tournament Info</h3>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Registration Deadline</p>
                    <p className="font-semibold">Dec 10, 2024</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-1">Entry Fee</p>
                    <p className="font-semibold">₹500</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-1">Organizer</p>
                    <p className="font-semibold">Bombay Badminton Club</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground mb-1">Contact</p>
                    <p className="font-semibold">contact@bbc.com</p>
                  </div>
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
