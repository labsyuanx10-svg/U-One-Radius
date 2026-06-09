import { useEffect } from "react"
import { Outlet, Navigate, useLocation } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"
import { useAuthStore } from "@/stores/authStore"
import { Loader2 } from "lucide-react"

export function AppShell() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    checkAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <main className="flex-1 p-3 md:p-4 lg:p-5 lg:ml-64">
        <Navbar />
        <div className="mt-4 md:mt-5">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
