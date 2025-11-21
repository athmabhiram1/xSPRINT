"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Users, Trophy, CheckCircle2 } from "lucide-react"
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
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

const tabs = ["Overview", "Fixtures", "Schedule", "Results"]

export default function TournamentDetailsPage() {
  const [activeTab, setActiveTab] = useState("Overview")
  const [isRegistering, setIsRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)
  const { toast } = useToast()

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegistering(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsRegistering(false)
      setRegistered(true)
      toast({
        title: "Registration Successful!",
        description: "You have been registered for the Elite Badminton Championship.",
      })
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header with Image */}
      <section className="relative h-96 overflow-hidden bg-muted">
        <Image src="/tournament-badminton-arena.jpg" alt="Tournament" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8 container-max">
          <div className="flex gap-2 mb-4">
            <span className="bg-primary text-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              Open for Registration
            </span>
            <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-white/30">
              Badminton
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">Elite Badminton Championship 2024</h1>
          <p className="text-gray-200 flex items-center gap-2 text-lg">
            <MapPin size={18} className="text-primary" /> Mumbai, India
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
                 <p className="font-bold">Dec 15-20</p>
               </div>
               <div className="text-center border-r border-border last:border-0">
                 <p className="text-xs text-muted-foreground uppercase tracking-wider">Format</p>
                 <p className="font-bold">Knockout</p>
               </div>
               <div className="text-center border-r border-border last:border-0">
                 <p className="text-xs text-muted-foreground uppercase tracking-wider">Players</p>
                 <p className="font-bold">128 Max</p>
               </div>
               <div className="text-center">
                 <p className="text-xs text-muted-foreground uppercase tracking-wider">Prize</p>
                 <p className="font-bold text-primary">₹5 Lakhs</p>
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
               <div className="py-12 text-center border border-dashed border-border rounded-xl">
                  <p className="text-muted-foreground">Fixtures will be generated once registration closes.</p>
               </div>
            )}
            
             {/* Placeholder for other tabs */}
            {(activeTab === "Schedule" || activeTab === "Results") && (
              <div className="py-12 text-center border border-dashed border-border rounded-xl">
                <p className="text-muted-foreground">Data will be available closer to the event date.</p>
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
                    <Button size="lg" className="w-full font-bold text-md" disabled={registered}>
                      {registered ? "Registered Successfully" : "Register Now"}
                    </Button>
                  </DialogTrigger>
                  {!registered && (
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Tournament Registration</DialogTitle>
                        <DialogDescription>
                          Enter your details to register for the Elite Badminton Championship.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleRegister}>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" placeholder="John Doe" required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="club">Club Name</Label>
                            <Input id="club" placeholder="Mumbai Badminton Association" required />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="category">Category</Label>
                            <select className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                              <option>Men's Singles</option>
                              <option>Women's Singles</option>
                              <option>Doubles</option>
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