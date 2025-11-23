"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trophy, Calendar, MapPin, Loader2, X } from "lucide-react"
import { getTournaments, createTournament, type Tournament } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function TournamentsManagementPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    startDate: "",
    endDate: "",
  })
  
  const [courts, setCourts] = useState([{ name: "Court 1" }])

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const data = await getTournaments({ includeEvents: true, includeCourts: true })
      if (data.success) {
        setTournaments(data.tournaments || [])
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch tournaments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTournaments()
  }, [])

  const addCourt = () => {
    setCourts([...courts, { name: `Court ${courts.length + 1}` }])
  }

  const removeCourt = (index: number) => {
    if (courts.length > 1) {
      setCourts(courts.filter((_, i) => i !== index))
    }
  }

  const updateCourtName = (index: number, name: string) => {
    const updated = [...courts]
    updated[index].name = name
    setCourts(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.location.trim() || !formData.startDate || !formData.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      const data = await createTournament({
        name: formData.name,
        location: formData.location,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        courts: courts.filter(c => c.name.trim())
      })

      if (data.success) {
        toast({
          title: "Success!",
          description: `Tournament "${formData.name}" created successfully`
        })
        setDialogOpen(false)
        setFormData({ name: "", location: "", startDate: "", endDate: "" })
        setCourts([{ name: "Court 1" }])
        fetchTournaments()
      } else {
        throw new Error(data.error || "Failed to create tournament")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create tournament",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container-max py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Tournament Management</h1>
            <p className="text-muted-foreground">Create and manage tournaments</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} />
                Create Tournament
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Tournament</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Tournament Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., National Championship 2025"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Sports Complex Arena"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Courts</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addCourt}>
                      <Plus size={16} className="mr-1" />
                      Add Court
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {courts.map((court, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={court.name}
                          onChange={(e) => updateCourtName(index, e.target.value)}
                          placeholder={`Court ${index + 1}`}
                        />
                        {courts.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeCourt(index)}
                          >
                            <X size={16} />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Create Tournament
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Trophy className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tournaments</p>
                <p className="text-2xl font-bold">{tournaments.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : tournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                href={`/tournaments/${tournament.id}`}
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow group"
              >
                <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Trophy className="text-primary" size={64} />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                    {tournament.name}
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{tournament.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} />
                      <span>
                        {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      {tournament.events?.length || 0} Events
                    </span>
                    <span className="px-2 py-1 bg-secondary/10 text-secondary rounded-full text-xs font-medium">
                      {tournament.courts?.length || 0} Courts
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <Trophy className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h3 className="text-lg font-bold mb-2">No tournaments yet</h3>
            <p className="text-muted-foreground mb-4">Create your first tournament to get started</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus size={20} className="mr-2" />
              Create Tournament
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
