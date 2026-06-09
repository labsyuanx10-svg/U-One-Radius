import { Search, Bell, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MobileNav } from "./MobileNav"
import { useAuthStore } from "@/stores/authStore"

export function Navbar() {
  const user = useAuthStore((s) => s.user)
  const initial = user?.fullname?.charAt(0)?.toUpperCase() || "A"

  return (
    <div className="flex items-center justify-between gap-3 animate-slide-in-up">
      <div className="flex items-center gap-2 flex-1">
        <MobileNav />

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 pr-3 md:pr-16 h-9 text-sm bg-card border-border transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
          />
          <kbd className="hidden md:inline-block absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted rounded border border-border">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1.5 md:gap-2">
        <button className="relative hover:bg-secondary transition-all duration-300 hover:scale-110 h-8 w-8 flex items-center justify-center rounded-lg">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
        </button>

        <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-border">
          <Avatar className="w-7 h-7 md:w-8 md:h-8 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">{initial}</AvatarFallback>
          </Avatar>
          <div className="text-xs hidden sm:block">
            <p className="font-semibold text-foreground">{user?.fullname || "Admin"}</p>
            <p className="text-muted-foreground text-[10px] capitalize">{user?.role || "admin"}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
