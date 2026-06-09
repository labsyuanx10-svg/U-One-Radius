import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Activity } from "lucide-react"

interface LogEntry {
  id: number
  user_name: string
  user_role: string
  action: string
  description: string
  ip_address: string
  created_at: string
}

const actionColors: Record<string, "info" | "success" | "warning" | "destructive" | "secondary"> = {
  ticket_create: "info",
  ticket_update: "warning",
  send_wa_reminder: "success",
  create_admin: "destructive",
  customer_create: "info",
  customer_update: "warning",
  payment_create: "success",
  login: "secondary",
}

const actionLabels: Record<string, string> = {
  ticket_create: "Tiket Dibuat",
  ticket_update: "Tiket Diupdate",
  send_wa_reminder: "WA Terkirim",
  create_admin: "Admin Baru",
  customer_create: "Pelanggan Baru",
  customer_update: "Pelanggan Diupdate",
  payment_create: "Pembayaran",
  login: "Login",
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export function ActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    api.get("/logs")
      .then((res) => setLogs(res.data?.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(
    (l) =>
      l.description?.toLowerCase().includes(search.toLowerCase()) ||
      l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.action?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Activity Log</h2>
        <p className="text-sm text-muted-foreground">Riwayat aktivitas admin & teknisi</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Cari aktivitas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Belum ada log</TableCell></TableRow>
              ) : (
                filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(l.created_at)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{l.user_name || "System"}</span>
                      <span className="text-xs text-muted-foreground ml-1">({l.user_role})</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={actionColors[l.action] || "secondary"}>
                        {actionLabels[l.action] || l.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{l.description || "-"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{l.ip_address || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
