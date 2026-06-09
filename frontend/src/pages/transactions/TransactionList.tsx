import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileText, Receipt, Loader2, MessageSquare, Download } from "lucide-react"

interface Transaction {
  id: number; invoice_no: string; user_name: string; amount: number
  status: string; due_date: string; created_at: string; payment_method: string
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(val)
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)

  // Payment dialog state
  const [payDialogOpen, setPayDialogOpen] = useState(false)
  const [payingId, setPayingId] = useState<number | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("Transfer")
  const [paymentNote, setPaymentNote] = useState("")
  const [paying, setPaying] = useState(false)

  const fetchTransactions = () => {
    setLoading(true)
    api.get(`/transactions?page=${page}&limit=${limit}`)
      .then((res) => {
        const d = res.data
        setTransactions(Array.isArray(d) ? d : d?.data || [])
        setTotal(d?.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTransactions()
  }, [page])

  const openPayDialog = (tx: Transaction) => {
    setPayingId(tx.id)
    setPaymentMethod("Transfer")
    setPaymentNote("")
    setPayDialogOpen(true)
  }

  const handlePay = async () => {
    if (!payingId) return
    setPaying(true)
    try {
      await api.put(`/transactions/${payingId}`, {
        status: "paid",
        payment_method: paymentMethod,
        payment_note: paymentNote,
      })
      setPayDialogOpen(false)
      fetchTransactions()
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal mencatat pembayaran")
    } finally {
      setPaying(false)
    }
  }

  const handleSendWa = async (id: number) => {
    try {
      await api.post(`/transactions/${id}/send-wa`)
      alert("Invoice berhasil dikirim via WA")
    } catch {}
  }

  const filtered = transactions.filter(
    (t) =>
      (t.user_name || "")?.toLowerCase().includes(search.toLowerCase()) ||
      t.invoice_no?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const exportQuery = new URLSearchParams()
  const token = localStorage.getItem("token")
  if (token) exportQuery.set("token", token)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tagihan</h2>
          <p className="text-sm text-muted-foreground">Kelola transaksi dan invoice</p>
        </div>
        <Button variant="outline" onClick={() => window.open(`/api/transactions/export?${exportQuery.toString()}`, "_blank")}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari invoice atau pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="ml-auto">{total} transaksi</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Tidak ada transaksi</TableCell></TableRow>
              ) : (
                filtered.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.invoice_no}</TableCell>
                    <TableCell>{tx.user_name}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell>{new Date(tx.due_date).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge variant={tx.status === "paid" ? "success" : "warning"}>
                        {tx.status === "paid" ? "Lunas" : "Belum Bayar"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {tx.status === "unpaid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => openPayDialog(tx)}
                          >
                            Bayar
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Cetak Invoice">
                          <a href={`/api/transactions/${tx.id}/pdf`} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Kirim via WA" onClick={() => handleSendWa(tx.id)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages} ({total} transaksi)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Payment Dialog */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Pembayaran</DialogTitle>
            <DialogDescription>Konfirmasi dan catat pembayaran tagihan</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Metode Pembayaran</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Tunai">Tunai</SelectItem>
                  <SelectItem value="QRIS">QRIS</SelectItem>
                  <SelectItem value="Auto-debit">Auto-debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Keterangan</label>
              <textarea
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Catatan pembayaran (opsional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Batal</Button>
            <Button onClick={handlePay} disabled={paying}>
              {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Konfirmasi Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
