import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: "up" | "down"
  trendValue?: string
  color?: "indigo" | "green" | "red" | "amber" | "sky"
}

const colorMap = {
  indigo: "from-indigo-500/15 to-indigo-600/5 border-indigo-800/40",
  green: "from-emerald-500/15 to-emerald-600/5 border-emerald-800/40",
  red: "from-red-500/15 to-red-600/5 border-red-800/40",
  amber: "from-amber-500/15 to-amber-600/5 border-amber-800/40",
  sky: "from-sky-500/15 to-sky-600/5 border-sky-800/40",
}

const iconBgMap = {
  indigo: "bg-indigo-900/50 text-indigo-400",
  green: "bg-emerald-900/50 text-emerald-400",
  red: "bg-red-900/50 text-red-400",
  amber: "bg-amber-900/50 text-amber-400",
  sky: "bg-sky-900/50 text-sky-400",
}

const trendColorMap = {
  up: "text-emerald-400",
  down: "text-red-400",
}

export function StatCard({ title, value, icon, trend, trendValue, color = "indigo" }: StatCardProps) {
  return (
    <div className={cn("bento-card relative overflow-hidden bg-gradient-to-br", colorMap[color])}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-2xl font-bold mt-1 text-white">
            {typeof value === "number" && isNaN(value) ? "—" : value}
          </p>
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2 text-xs font-medium">
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-400" />
              )}
              <span className={trendColorMap[trend]}>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconBgMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  )
}
