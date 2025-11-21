import Image from "next/image"
import { MapPin, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TournamentCardProps {
  id: string
  title: string
  image: string
  location: string
  date: string
  category: string
  participants: number
}

export function TournamentCard({ id, title, image, location, date, category, participants }: TournamentCardProps) {
  return (
    <div className="group overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 glow-primary">
      <div className="relative h-48 overflow-hidden bg-muted">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="p-4">
        <h3 className="font-heading font-bold text-lg mb-2 line-clamp-1">{title}</h3>

        <div className="space-y-2 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <span>{participants} Players</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">{category}</span>
          <Button size="sm">Register</Button>
        </div>
      </div>
    </div>
  )
}
