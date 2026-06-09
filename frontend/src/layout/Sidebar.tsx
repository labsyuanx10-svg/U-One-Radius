import { cn } from "@/lib/utils"
import { NavLink, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Wifi,
  Router,
  Map,
  Layers,
  Ticket,
  Receipt,
  Activity,
  Settings,
  MessageSquare,
  LogOut,
  ChevronLeft,
  Shield,
  ScrollText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, to: "/" },
  { label: "Pelanggan", icon: Users, to: "/customers" },
  { label: "Paket & Pool", icon: Wifi, to: "/plans" },
  { label: "Router", icon: Router, to: "/routers" },
  { label: "Infrastruktur", icon: Map, to: "/infrastructure" },
  { label: "Group", icon: Layers, to: "/groups", role: "superadmin" },
  { label: "Tagihan", icon: Receipt, to: "/transactions" },
  { label: "Tiket", icon: Ticket, to: "/tickets" },
  { label: "Radius", icon: Activity, to: "/radacct" },
  { label: "WA Gateway", icon: MessageSquare, to: "/settings/wa" },
  { label: "Admin Users", icon: Shield, to: "/admin-users", role: "superadmin" },
  { label: "Logs", icon: ScrollText, to: "/logs" },
  { label: "Settings", icon: Settings, to: "/settings", role: "superadmin" },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const logout = useAuthStore((s) => s.logout)
  const currentUser = useAuthStore((s) => s.user)

  const visibleItems = navItems.filter(
    (item) => !item.role || (currentUser && currentUser.role === item.role)
  )

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/5 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
      style={{ backgroundColor: "hsl(226 40% 10%)" }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/5">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
              U1
            </div>
            <span className="font-semibold text-white text-sm">U-One Radius</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={cn(
            "text-sidebar-foreground hover:text-white hover:bg-sidebar-accent rounded-lg",
            collapsed && "mx-auto"
          )}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-primary/15 text-primary-foreground"
                  : "text-sidebar-foreground hover:text-white hover:bg-sidebar-accent"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "")} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-white/5">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:text-red-400 hover:bg-sidebar-accent transition-all duration-200"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
