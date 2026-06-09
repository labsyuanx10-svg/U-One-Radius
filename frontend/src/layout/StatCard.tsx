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
  indigo: "from-indigo-500/20 to-indigo-600/10 border-indigo-200 dark:border-indigo-900",
  green: "from-emerald-500/20 to-emerald-600/10 border-emerald-200 dark:border-emerald-900",
  red: "from-red-500/20 to-red-600/10 border-red-200 dark:border-red-900",
  amber: "from-amber-500/20 to-amber-600/10 border-amber-200 dark:border-amber-900",
  sky: "from-sky-500/20 to-sky-600/10 border-sky-200 dark:border-sky-900",
}

const iconBgMap = {
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
  red: "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400",
  amber: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-400",
}

export function StatCard({ title, value, icon, trend, trendValue, color = "indigo" }: StatCardProps) {
  return (
    <div className={cn("bento-card relative overflow-hidden", colorMap[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={trend === "up" ? "text-emerald-600" : "text-red-600"}>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBgMap[color])}>
          {icon}
        </div>
      </div>
    </div>
  )
}
