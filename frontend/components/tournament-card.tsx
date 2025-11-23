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
  status?: string
}

export function TournamentCard({ id, title, image, location, date, category, participants, status }: TournamentCardProps) {
  const isLive = status === 'ONGOING' || status === 'LIVE';

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-500 hover:shadow-2xl hover:border-primary/50">
      <div className="relative h-52 overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

        {isLive && (
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold rounded-full animate-pulse shadow-lg border border-red-500/50">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              LIVE
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="font-heading font-bold text-xl text-white mb-1 line-clamp-2 drop-shadow-md group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-gray-300 text-xs font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {category}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-2 rounded-lg">
            <Calendar size={14} className="text-primary" />
            <span className="truncate">{date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/50 p-2 rounded-lg">
            <MapPin size={14} className="text-primary" />
            <span className="truncate">{location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[...Array(Math.min(3, participants > 0 ? 3 : 0))].map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] overflow-hidden">
                  <Users size={12} className="text-muted-foreground" />
                </div>
              ))}
            </div>
            <span className="text-sm font-medium text-foreground/80">
              {participants > 0 ? `${participants} Players` : 'Open for Registration'}
            </span>
          </div>
          <Button size="sm" className="rounded-full px-4 shadow-lg hover:shadow-primary/25 transition-all">
            Register
          </Button>
        </div>
      </div>
    </div>
  )
}
