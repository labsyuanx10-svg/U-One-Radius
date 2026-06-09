import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, Ticket, Loader2 } from "lucide-react"

interface Ticket {
  id: number; ticket_no: string; subject: string; customer_name: string
  category: string; priority: string; status: string; created_at: string
}

export function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({ customer_id: "", subject: "", category: "technical", priority: "normal", description: "" })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get("/tickets")
      setTickets(Array.isArray(res.data) ? res.data : res.data?.data || [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post("/tickets", form)
      fetchData(); setDialogOpen(false)
      setForm({ customer_id: "", subject: "", category: "technical", priority: "normal", description: "" })
    } catch (err: any) { alert(err.response?.data?.message || "Gagal") }
    finally { setSaving(false) }
  }

  const priorityColor = (p: string) => p === "high" ? "destructive" as const : p === "normal" ? "warning" as const : "secondary" as const
  const statusColor = (s: string) => s === "open" ? "info" as const : s === "closed" ? "secondary" as const : "warning" as const

  const filtered = tickets.filter(t => t.subject?.toLowerCase().includes(search.toLowerCase()) || t.ticket_no?.includes(search))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tiket Gangguan</h2>
          <p className="text-sm text-muted-foreground">Kelola laporan gangguan pelanggan</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Buat Tiket
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Cari tiket..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Tiket</TableHead>
                <TableHead>Subjek</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">Tidak ada tiket</TableCell></TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs font-medium">{t.ticket_no}</TableCell>
                    <TableCell className="font-medium">{t.subject}</TableCell>
                    <TableCell>{t.customer_name || "-"}</TableCell>
                    <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                    <TableCell><Badge variant={priorityColor(t.priority)}>{t.priority}</Badge></TableCell>
                    <TableCell><Badge variant={statusColor(t.status)}>{t.status}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(t.created_at).toLocaleDateString("id-ID")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Buat Tiket Baru</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ID Pelanggan</label>
              <Input value={form.customer_id} onChange={(e) => setForm(p => ({ ...p, customer_id: e.target.value }))} placeholder="ID pelanggan (opsional)" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subjek <span className="text-destructive">*</span></label>
              <Input value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} required placeholder="Judul gangguan" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prioritas</label>
                <select value={form.priority} onChange={(e) => setForm(p => ({ ...p, priority: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi</label>
              <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="flex min-h-[100px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
