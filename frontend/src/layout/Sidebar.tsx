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
  Shield,
  ScrollText,
} from "lucide-react"
import { useState } from "react"
import { useAuthStore } from "@/stores/authStore"

const menuItems = [
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
]

const generalItems = [
  { label: "Settings", icon: Settings, to: "/settings" },
  { label: "Logout", icon: LogOut, to: "/logout" },
]

export function Sidebar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const pathname = useLocation().pathname
  const logout = useAuthStore((s) => s.logout)
  const currentUser = useAuthStore((s) => s.user)

  const filteredMenu = menuItems.filter(
    (item) => !item.role || (currentUser && currentUser.role === item.role)
  )

  const isActive = (to: string) => {
    if (to === "/") return pathname === "/"
    return pathname.startsWith(to)
  }

  return (
    <aside className="fixed top-0 left-0 w-64 bg-card border-r border-border p-4 h-screen overflow-y-auto lg:block">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-6 group cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:scale-110 duration-300 relative">
          <span className="text-xs font-bold text-primary-foreground">U1</span>
        </div>
        <span className="text-lg font-semibold text-foreground">U-One Radius</span>
      </div>

      <div className="space-y-4 flex-1">
        {/* Menu */}
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Menu</p>
          <nav className="space-y-0.5">
            {filteredMenu.map((item) => {
              const active = isActive(item.to)
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={item.label === "Logout" ? (e) => { e.preventDefault(); logout() } : undefined}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    active
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    hoveredItem === item.label && !active && "translate-x-1",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>

      {/* General */}
      <div>
        <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">General</p>
        <nav className="space-y-0.5">
          <NavLink
            to="/settings"
            onMouseEnter={() => setHoveredItem("Settings")}
            onMouseLeave={() => setHoveredItem(null)}
            className={cn(
              "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-300",
              isActive("/settings")
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              hoveredItem === "Settings" && !isActive("/settings") && "translate-x-1",
            )}
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </NavLink>
          <button
            onMouseEnter={() => setHoveredItem("Logout")}
            onMouseLeave={() => setHoveredItem(null)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </nav>
      </div>
    </aside>
  )
}
