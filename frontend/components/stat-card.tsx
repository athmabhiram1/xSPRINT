import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
}

export function StatCard({ icon: Icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 p-6 bg-card rounded-xl border border-border glow-primary">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-heading font-bold">{value}</p>
      </div>
    </div>
  )
}
