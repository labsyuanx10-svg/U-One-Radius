import { useState, useEffect } from "react"
import api from "@/lib/api"
import { StatCard } from "@/layout/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  Wifi,
  XCircle,
  DollarSign,
  Activity,
  Ticket,
  TrendingUp,
} from "lucide-react"
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"

interface Stats {
  total: number
  active: number
  expired: number
  isolir: number
  revenue: number
}

interface Transaction {
  id: number
  invoice_no: string
  customer_name: string
  amount: number
  status: string
}

interface Ticket {
  id: number
  subject: string
  customer_name: string
  status: string
}

const monthlyRevenueData = [
  { month: "Jan", amount: 12500000 },
  { month: "Feb", amount: 14800000 },
  { month: "Mar", amount: 13200000 },
  { month: "Apr", amount: 15900000 },
  { month: "Mei", amount: 14200000 },
  { month: "Jun", amount: 17200000 },
]

function formatCurrency(val: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val)
}

function statusColor(status: string) {
  switch (status) {
    case "paid":
      return "success" as const
    case "unpaid":
      return "warning" as const
    default:
      return "secondary" as const
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = { paid: "Lunas", unpaid: "Belum Bayar", open: "Open", closed: "Closed", pending: "Pending" }
  return map[status] || status
}

function ticketSeverity(status: string) {
  const map: Record<string, "info" | "secondary" | "warning"> = { open: "info", closed: "secondary", pending: "warning" }
  return map[status] || "secondary"
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, expired: 0, isolir: 0, revenue: 0 })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, txRes, ticketRes] = await Promise.all([
          api.get("/dashboard/stats").catch(() => ({ data: { total: 0, active: 0, expired: 0, isolir: 0, revenue: 0 } })),
          api.get("/transactions?limit=5").catch(() => ({ data: [] })),
          api.get("/tickets?limit=5").catch(() => ({ data: [] })),
        ])
        setStats(statsRes.data)
        setTransactions(Array.isArray(txRes.data) ? txRes.data : txRes.data?.data || [])
        setTickets(Array.isArray(ticketRes.data) ? ticketRes.data : ticketRes.data?.data || [])
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Pelanggan"
          value={stats.total}
          icon={<Users className="h-5 w-5" />}
          trend="up"
          trendValue="+12%"
          delay="0ms"
          isFirst
        />
        <StatCard
          title="Aktif"
          value={stats.active}
          icon={<Wifi className="h-5 w-5" />}
          trend="up"
          trendValue="+8%"
          delay="100ms"
        />
        <StatCard
          title="Expired / Isolir"
          value={stats.expired + stats.isolir}
          icon={<XCircle className="h-5 w-5" />}
          trend="down"
          trendValue="-3%"
          delay="200ms"
        />
        <StatCard
          title="Revenue Bulan Ini"
          value={formatCurrency(stats.revenue)}
          icon={<DollarSign className="h-5 w-5" />}
          trend="up"
          trendValue="+15%"
          delay="300ms"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 transition-all duration-500 hover:shadow-xl animate-slide-in-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Pelanggan per Status
            </h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "Aktif", value: stats.active },
                  { name: "Expired", value: stats.expired },
                  { name: "Isolir", value: stats.isolir },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-muted-foreground" />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "13px" }}
                />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} maxBarSize={60}>
                  {[
                    { name: "Aktif", value: stats.active },
                    { name: "Expired", value: stats.expired },
                    { name: "Isolir", value: stats.isolir },
                  ].map((entry, idx) => (
                    <Cell key={idx} fill={[`oklch(0.45 0.18 265)`, `oklch(0.577 0.245 27.325)`, `oklch(0.65 0.12 265)`][idx]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 transition-all duration-500 hover:shadow-xl animate-slide-in-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue 6 Bulan
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Monthly</span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.45 0.18 265)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.45 0.18 265)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} stroke="currentColor" className="text-muted-foreground" />
                <YAxis
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 12 }}
                  stroke="currentColor" className="text-muted-foreground"
                  tickFormatter={(v) => `Rp${(v / 1000000).toFixed(0)}jt`}
                />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", fontSize: "13px" }}
                  formatter={(v: number) => [formatCurrency(v), "Revenue"]}
                />
                <Area type="monotone" dataKey="amount" stroke="oklch(0.45 0.18 265)" fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                Lihat Semua
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground/80 py-12">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="h-5 w-5 text-muted-foreground/50" />
                        <span>Belum ada transaksi</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.customer_name}</TableCell>
                      <TableCell className="text-muted-foreground">{tx.invoice_no}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={statusColor(tx.status)}>{statusLabel(tx.status)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Tiket Terbaru
              </CardTitle>
              <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                Lihat Semua
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subjek</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground/80 py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Ticket className="h-5 w-5 text-muted-foreground/50" />
                        <span>Belum ada tiket</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.subject}</TableCell>
                      <TableCell className="text-muted-foreground">{t.customer_name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={ticketSeverity(t.status)}>{statusLabel(t.status)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
