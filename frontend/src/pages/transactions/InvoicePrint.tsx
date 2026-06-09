import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Loader2 } from "lucide-react"

export function InvoicePrint() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [iframeSrc, setIframeSrc] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setError("Unauthorized")
      setLoading(false)
      return
    }
    setIframeSrc(`/api/transactions/${id}/pdf?token=${token}`)
    setLoading(false)
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (error) return <div className="text-center py-20 text-destructive">{error}</div>

  return (
    <div className="h-[calc(100vh-8rem)]">
      <iframe src={iframeSrc} className="w-full h-full rounded-xl border" title="Invoice PDF" />
    </div>
  )
}
