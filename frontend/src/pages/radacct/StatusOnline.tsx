import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Wifi, XCircle, Activity } from "lucide-react"

interface OnlineUser {
  radacctid: number; username: string; framedipaddress: string
  callingstationid: string; acctstarttime: string; acctinputoctets: string
  acctoutputoctets: string; acctsessiontime: string; customer_name: string
  plan_name: string
}

interface LogEntry {
  id: number; username: string; acctstarttime: string; acctstoptime: string
  acctterminatecause: string; framedipaddress: string; callingstationid: string
  acctinputoctets: string; acctoutputoctets: string; customer_name: string
}

function formatBytes(bytes: string) {
  const n = Number(bytes)
  if (!n) return "0 B"
  const units = ["B", "KB", "MB", "GB", "TB"]
  let i = 0
  let size = n
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++ }
  return `${size.toFixed(1)} ${units[i]}`
}

function formatDuration(seconds: string) {
  const s = Number(seconds)
  if (!s) return "0s"
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}h ${m}m`
}

export function StatusOnline() {
  const [users, setUsers] = useState<OnlineUser[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [onlineRes, logRes] = await Promise.all([
          api.get("/radacct/online").catch(() => ({ data: [] })),
          api.get("/radacct/log?limit=50").catch(() => ({ data: [] })),
        ])
        setUsers(Array.isArray(onlineRes.data) ? onlineRes.data : onlineRes.data?.data || [])
        setLogs(Array.isArray(logRes.data) ? logRes.data : logRes.data?.data || [])
      } catch {}
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.customer_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">RADIUS Monitoring</h2>
          <p className="text-sm text-muted-foreground">Status online user dan log koneksi</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="text-sm px-3 py-1">
            <Activity className="mr-1.5 h-3.5 w-3.5" />
            {users.length} Online
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="online">
        <TabsList>
          <TabsTrigger value="online"><Wifi className="mr-2 h-4 w-4" />User Online</TabsTrigger>
          <TabsTrigger value="log"><Activity className="mr-2 h-4 w-4" />Log Radius</TabsTrigger>
        </TabsList>

        <TabsContent value="online">
          <Card>
            <CardHeader className="pb-3">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Cari user..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>MAC</TableHead>
                    <TableHead>Traffic In</TableHead>
                    <TableHead>Traffic Out</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Mulai</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">Tidak ada user online</TableCell></TableRow>
                  ) : (
                    filteredUsers.map((u) => (
                      <TableRow key={u.radacctid}>
                        <TableCell className="font-mono text-xs font-medium">{u.username}</TableCell>
                        <TableCell>{u.customer_name || "-"}</TableCell>
                        <TableCell>{u.plan_name || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{u.framedipaddress}</TableCell>
                        <TableCell className="font-mono text-xs">{u.callingstationid}</TableCell>
                        <TableCell>{formatBytes(u.acctinputoctets)}</TableCell>
                        <TableCell>{formatBytes(u.acctoutputoctets)}</TableCell>
                        <TableCell>{formatDuration(u.acctsessiontime)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(u.acctstarttime).toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="log">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>MAC</TableHead>
                    <TableHead>Traffic</TableHead>
                    <TableHead>Mulai</TableHead>
                    <TableHead>Selesai</TableHead>
                    <TableHead>Alasan Putus</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Belum ada log</TableCell></TableRow>
                  ) : (
                    logs.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-mono text-xs font-medium">{l.username}</TableCell>
                        <TableCell>{l.customer_name || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{l.framedipaddress || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{l.callingstationid || "-"}</TableCell>
                        <TableCell>{formatBytes(l.acctinputoctets || "0")} / {formatBytes(l.acctoutputoctets || "0")}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.acctstarttime ? new Date(l.acctstarttime).toLocaleString("id-ID") : "-"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.acctstoptime ? new Date(l.acctstoptime).toLocaleString("id-ID") : "-"}</TableCell>
                        <TableCell><Badge variant="outline">{l.acctterminatecause || "-"}</Badge></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
