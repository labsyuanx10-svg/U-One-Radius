import { Bell, Moon, Sun, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/stores/authStore"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface NavbarProps {
  onToggleDark: () => void
  dark: boolean
}

export function Navbar({ onToggleDark, dark }: NavbarProps) {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-xl px-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Selamat datang kembali{user?.fullname ? `, ${user.fullname}` : ""}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full relative" onClick={() => {}}>
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={onToggleDark}>
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2 ml-2 pl-2 border-l">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {user?.fullname?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-medium leading-tight">{user?.fullname || "Admin"}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role || "admin"}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
