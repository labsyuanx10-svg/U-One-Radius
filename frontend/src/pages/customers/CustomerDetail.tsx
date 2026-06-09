import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Edit, Loader2, MapPin, Phone, Mail, Wifi, Smartphone, FileText, Ban, CheckCircle } from "lucide-react"

interface Customer {
  id: number; uid: string; name: string; phone: string; email: string; nik: string
  address: string; group_name: string; plan_name: string; status: string
  username_radius: string; device_merk: string; device_serial: string
  coordinates: string; created_at: string
}

interface Transaction { id: number; invoice_no: string; amount: number; status: string; due_date: string }
interface Ticket { id: number; subject: string; status: string; created_at: string }
interface Subscription { id: number; plan_name: string; started_at: string; expired_at: string; status: string }

function formatCurrency(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val)
}

export function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [isolirDialogOpen, setIsoilrDialogOpen] = useState(false)
  const [isolirLoading, setIsoilrLoading] = useState(false)

  const fetchData = async () => {
    try {
      const [cRes, txRes, tRes, sRes] = await Promise.all([
        api.get(`/customers/${id}`),
        api.get(`/customers/${id}/transactions`).catch(() => ({ data: [] })),
        api.get(`/customers/${id}/tickets`).catch(() => ({ data: [] })),
        api.get(`/customers/${id}/subscriptions`).catch(() => ({ data: [] })),
      ])
      const c = cRes.data?.data || cRes.data
      setCustomer(c)
      setTransactions(Array.isArray(txRes.data) ? txRes.data : txRes.data?.data || [])
      setTickets(Array.isArray(tRes.data) ? tRes.data : tRes.data?.data || [])
      setSubscriptions(Array.isArray(sRes.data) ? sRes.data : sRes.data?.data || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [id])

  const handleToggleIsolir = async () => {
    if (!customer) return
    setIsoilrLoading(true)
    try {
      const res = await api.put(`/customers/${customer.id}/toggle-isolir`)
      const updated = res.data?.data || res.data
      setCustomer((prev) => prev ? { ...prev, status: updated.status } : prev)
      setIsoilrDialogOpen(false)
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal toggle isolir")
    } finally {
      setIsoilrLoading(false)
    }
  }

  const isIsolirOrExpired = customer?.status === "isolir" || customer?.status === "expired"

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!customer) return <p className="text-muted-foreground py-20 text-center">Pelanggan tidak ditemukan</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <Badge
              variant={
                customer.status === "active"
                  ? "success"
                  : customer.status === "isolir"
                    ? "warning"
                    : "destructive"
              }
            >
              {customer.status}
            </Badge>
            <Badge variant="outline" className="font-mono">{customer.uid}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Terdaftar sejak {new Date(customer.created_at).toLocaleDateString("id-ID")}</p>
        </div>
        <div className="flex gap-2">
          {isIsolirOrExpired ? (
            <Button
              variant="outline"
              className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              onClick={() => setIsoilrDialogOpen(true)}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Aktifkan
            </Button>
          ) : (
            <Button
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => setIsoilrDialogOpen(true)}
            >
              <Ban className="mr-2 h-4 w-4" />
              Isolir
            </Button>
          )}
          <Link to={`/customers/${id}/edit`}>
            <Button variant="outline"><Edit className="mr-2 h-4 w-4" />Edit</Button>
          </Link>
        </div>
      </div>

      {/* Info Cards Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Phone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">No. HP</p>
              <p className="font-medium">{customer.phone || "-"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Mail className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium">{customer.email || "-"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Wifi className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Username PPPoE</p>
              <p className="font-mono text-sm font-medium">{customer.username_radius || "-"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Smartphone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">ONT</p>
              <p className="font-medium">{customer.device_merk || "-"} {customer.device_serial ? `(${customer.device_serial})` : ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Alamat</CardTitle></CardHeader>
          <CardContent>
            <p>{customer.address || "Tidak ada alamat"}</p>
            {customer.coordinates && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {customer.coordinates}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Info Group & Paket</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Group</p>
              <p className="font-medium">{customer.group_name || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paket</p>
              <p className="font-medium">{customer.plan_name || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Tagihan</TabsTrigger>
          <TabsTrigger value="subscriptions">Langganan</TabsTrigger>
          <TabsTrigger value="tickets">Tiket</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada tagihan</TableCell></TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.invoice_no}</TableCell>
                        <TableCell>{formatCurrency(tx.amount)}</TableCell>
                        <TableCell>{new Date(tx.due_date).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={tx.status === "paid" ? "success" : "warning"}>{tx.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subscriptions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paket</TableHead>
                    <TableHead>Mulai</TableHead>
                    <TableHead>Berakhir</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Belum ada langganan</TableCell></TableRow>
                  ) : (
                    subscriptions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.plan_name}</TableCell>
                        <TableCell>{new Date(s.started_at).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell>{new Date(s.expired_at).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={s.status === "active" ? "success" : "warning"}>{s.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tickets">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subjek</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Belum ada tiket</TableCell></TableRow>
                  ) : (
                    tickets.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.subject}</TableCell>
                        <TableCell>{new Date(t.created_at).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={t.status === "open" ? "info" : t.status === "closed" ? "secondary" : "warning"}>{t.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Isolir Confirmation Dialog */}
      <Dialog open={isolirDialogOpen} onOpenChange={setIsoilrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isIsolirOrExpired ? "Aktifkan Pelanggan" : "Isolir Pelanggan"}</DialogTitle>
            <DialogDescription>
              {isIsolirOrExpired
                ? "Aktifkan kembali akses internet pelanggan ini?"
                : "Nonaktifkan akses internet pelanggan ini (isolir). Radius entry akan dihapus."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <p><strong>Pelanggan:</strong> {customer.name} ({customer.uid})</p>
            <p><strong>Status saat ini:</strong> {customer.status}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsoilrDialogOpen(false)}>Batal</Button>
            <Button
              variant={isIsolirOrExpired ? "default" : "destructive"}
              onClick={handleToggleIsolir}
              disabled={isolirLoading}
            >
              {isolirLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isIsolirOrExpired ? "Ya, Aktifkan" : "Ya, Isolir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
