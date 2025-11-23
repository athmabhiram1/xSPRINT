"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit2, Trash2, UserPlus, Loader2, Search } from "lucide-react"
import { getPlayers, createPlayer, getClubs, type Player, type Club } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function PlayersManagementPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "",
    weight: "",
    category: "",
    clubId: ""
  })

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      const data = await getPlayers()
      if (data.success) {
        setPlayers(data.players || [])
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch players",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchClubs = async () => {
    try {
      const data = await getClubs()
      if (data.success) {
        setClubs(data.clubs || [])
      }
    } catch (error) {
      console.error("Failed to fetch clubs", error)
    }
  }

  useEffect(() => {
    fetchPlayers()
    fetchClubs()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Player name is required",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      const data = await createPlayer({
        name: formData.name,
        email: formData.email || undefined,
        gender: formData.gender || undefined,
        weight: formData.weight || undefined,
        category: formData.category || undefined,
        clubId: formData.clubId || undefined
      })

      if (data.success) {
        toast({
          title: "Success!",
          description: `Player "${formData.name}" created successfully`
        })
        setDialogOpen(false)
        setFormData({ name: "", email: "", gender: "", weight: "", category: "", clubId: "" })
        fetchPlayers()
      } else {
        throw new Error(data.error || "Failed to create player")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create player",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container-max py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Player Management</h1>
            <p className="text-muted-foreground">Manage player profiles and registrations</p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={20} />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Player</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter player name"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="player@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="U15">U15</SelectItem>
                        <SelectItem value="U18">U18</SelectItem>
                        <SelectItem value="Senior">Senior</SelectItem>
                        <SelectItem value="Veteran">Veteran</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="e.g., 70kg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="club">Club</Label>
                    <Select value={formData.clubId} onValueChange={(value) => setFormData({ ...formData, clubId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select club" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map(club => (
                          <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                  Create Player
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <UserPlus className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Players</p>
                <p className="text-2xl font-bold">{players.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">Male</p>
            <p className="text-2xl font-bold">{players.filter(p => p.gender === "Male").length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">Female</p>
            <p className="text-2xl font-bold">{players.filter(p => p.gender === "Female").length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <p className="text-sm text-muted-foreground mb-1">With Clubs</p>
            <p className="text-2xl font-bold">{players.filter(p => p.clubId).length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
            <Input
              placeholder="Search players by name or email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Players Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : filteredPlayers.length > 0 ? (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="p-4 text-left font-medium text-muted-foreground">Name</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Email</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Gender</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Category</th>
                    <th className="p-4 text-left font-medium text-muted-foreground">Club</th>
                    <th className="p-4 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player) => (
                    <tr key={player.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-4 font-medium">{player.name}</td>
                      <td className="p-4 text-muted-foreground">{player.email || "-"}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                          {player.gender || "-"}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">{player.category || "-"}</td>
                      <td className="p-4 text-muted-foreground">{player.club?.name || "-"}</td>
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
            <UserPlus className="mx-auto mb-4 text-muted-foreground" size={48} />
            <h3 className="text-lg font-bold mb-2">No players found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search" : "Create your first player to get started"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus size={20} className="mr-2" />
                Add Player
              </Button>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
