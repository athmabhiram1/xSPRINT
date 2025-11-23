import { Clock, MapPin, Sparkles, Loader2 } from "lucide-react"
import { useState } from "react"
import { apiPost } from "@/lib/apiClient"

interface BracketMatchCardProps {
  matchId?: string
  playerA: string
  clubA: string
  playerB: string
  clubB: string
  court: string
  time: string
  status: "scheduled" | "live" | "completed"
}

export function BracketMatchCard({ matchId, playerA, clubA, playerB, clubB, court, time, status }: BracketMatchCardProps) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  const statusColors = {
    scheduled: "bg-neutral-100 text-neutral-800",
    live: "bg-primary/20 text-primary",
    completed: "bg-gray-200 text-gray-800",
  }

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (analysis) {
      setShowAnalysis(!showAnalysis)
      return
    }
    if (!matchId) return

    setLoading(true)
    setShowAnalysis(true)
    try {
      const res = await apiPost<{ data: string }>('/api/ai/analyze-match', { matchId })
      setAnalysis(res.data)
    } catch (error) {
      setAnalysis("Analysis unavailable.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 min-w-48 relative group">
      {matchId && (
        <button
          onClick={handleAnalyze}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-indigo-50 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
          title="AI Analysis"
        >
          <Sparkles size={14} />
        </button>
      )}

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

      {showAnalysis && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-20 p-4 flex flex-col items-center justify-center text-center rounded-lg animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-1 text-indigo-600 font-bold text-[10px] uppercase tracking-wider mb-2">
            <Sparkles size={12} /> Gemini Insight
          </div>
          {loading ? (
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          ) : (
            <p className="text-xs font-medium text-muted-foreground leading-relaxed italic">"{analysis}"</p>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setShowAnalysis(false); }}
            className="mt-3 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            DISMISS
          </button>
        </div>
      )}
    </div>
  )
}
