import { Clock, MapPin } from "lucide-react"

interface BracketMatchCardProps {
  playerA: string
  clubA: string
  playerB: string
  clubB: string
  court: string
  time: string
  status: "scheduled" | "live" | "completed"
}

export function BracketMatchCard({ playerA, clubA, playerB, clubB, court, time, status }: BracketMatchCardProps) {
  const statusColors = {
    scheduled: "bg-neutral-100 text-neutral-800",
    live: "bg-primary/20 text-primary",
    completed: "bg-gray-200 text-gray-800",
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 min-w-48">
      <div className="space-y-3 mb-3">
        <div>
          <p className="font-semibold text-sm">{playerA}</p>
          <p className="text-xs text-muted-foreground">{clubA}</p>
        </div>
        <div className="border-t border-border"></div>
        <div>
          <p className="font-semibold text-sm">{playerB}</p>
          <p className="text-xs text-muted-foreground">{clubB}</p>
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin size={14} />
          <span>{court}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={14} />
          <span>{time}</span>
        </div>
        <div className={`inline-block px-2 py-1 rounded text-xs font-semibold ${statusColors[status]}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>
    </div>
  )
}
