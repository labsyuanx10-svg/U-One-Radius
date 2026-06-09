import { cn } from "@/lib/utils"
import { ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: "up" | "down"
  trendValue?: string
  color?: "indigo" | "green" | "red" | "amber" | "sky"
  delay?: string
  isFirst?: boolean
}

export function StatCard({ title, value, icon, trend, trendValue, color = "indigo", delay = "0ms", isFirst }: StatCardProps) {
  const isFirstCard = isFirst

  return (
    <div
      style={{ animationDelay: delay }}
      className={cn(
        "p-4 transition-all duration-500 ease-out animate-slide-in-up cursor-pointer shadow-lg hover:shadow-2xl rounded-xl",
        isFirstCard
          ? "bg-primary text-primary-foreground"
          : "bg-card text-card-foreground hover:scale-105",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className={cn("text-xs font-medium", isFirstCard ? "opacity-90" : "text-muted-foreground")}>
          {title}
        </h3>
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300",
            isFirstCard ? "bg-primary-foreground/20" : "bg-primary",
          )}
        >
          <ArrowUpRight
            className={cn(
              "w-3 h-3",
              isFirstCard ? "text-primary-foreground" : "text-primary-foreground",
            )}
          />
        </div>
      </div>
      <p className="text-3xl font-bold mb-2">
        {typeof value === "number" && isNaN(value) ? "—" : value}
      </p>
      <div className="flex items-center gap-1.5 text-xs opacity-80">
        {trend && trendValue && (
          <>
            {trend === "up" ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{trendValue}</span>
          </>
        )}
      </div>
    </div>
  )
}
