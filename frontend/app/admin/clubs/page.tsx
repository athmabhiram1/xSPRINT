"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Edit2, Trash2, Users, Loader2 } from "lucide-react"
import { getClubs, createClub, type Club } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function ClubsManagementPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [clubName, setClubName] = useState("")
  const [clubLocation, setClubLocation] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const fetchClubs = async () => {
    try {
      setLoading(true)
      const data = await getClubs()
      if (data.success) {
        setClubs(data.clubs || [])
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch clubs",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClubs()
  }, [])

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!clubName.trim()) {
      toast({
        title: "Validation Error",
        description: "Club name is required",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      const data = await createClub({ 
        name: clubName,
        description: clubLocation 
      })

      if (data.success) {
        toast({
          title: "Success!",
          description: `Club "${clubName}" created successfully`
        })
        setDialogOpen(false)
        setClubName("")
        setClubLocation("")
        fetchClubs()
      } else {
        throw new Error(data.error || "Failed to create club")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create club",
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
            <h1 className="text-3xl font-bold mb-2">Club Management</h1>
            <p className="text-muted-foreground">Manage sports clubs and organizations</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} />
                Add Club
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Club</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateClub} className="space-y-4">
                <div>
                  <Label htmlFor="clubName">Club Name *</Label>
                  <Input
                    id="clubName"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="Enter club name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clubLocation">Location (Optional)</Label>
                  <Input
                    id="clubLocation"
                    value={clubLocation}
                    onChange={(e) => setClubLocation(e.target.value)}
                    placeholder="Enter location"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Create Club
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
                <Users className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clubs</p>
                <p className="text-2xl font-bold">{clubs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clubs Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : clubs.length > 0 ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-4 text-left font-medium text-muted-foreground">Club Name</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Location</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Players</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clubs.map((club) => (
                    <tr key={club.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{club.name}</td>
                      <td className="p-4 text-muted-foreground">{club.description || club.location || "-"}</td>
                      <td className="p-4 text-muted-foreground">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          0 players
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <Users className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h3 className="text-lg font-bold mb-2">No clubs yet</h3>
            <p className="text-muted-foreground mb-4">Create your first club to get started</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus size={20} className="mr-2" />
              Add Club
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
