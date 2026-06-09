import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Loader2, Search } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

interface OdcForm {
  name: string; code: string; address: string; latitude: string; longitude: string
  capacity: string; port_used: string; router_id: string; status: string; notes: string
}

const emptyForm: OdcForm = {
  name: "", code: "", address: "", latitude: "0", longitude: "0",
  capacity: "16", port_used: "0", router_id: "", status: "active", notes: "",
}

export function OdcList() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState<OdcForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const currentUser = useAuthStore((s) => s.user)
  const limit = 15

  const fetchData = async (p = page) => {
    setLoading(true)
    try {
      const res = await api.get("/odc", { params: { page: p, limit, search } })
      setItems(res.data?.data || [])
      setTotal(res.data?.total || 0)
    } catch {}
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [page, search])

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "", code: editItem.code || "", address: editItem.address || "",
        latitude: String(editItem.latitude || "0"), longitude: String(editItem.longitude || "0"),
        capacity: String(editItem.capacity || "16"), port_used: String(editItem.port_used || "0"),
        router_id: String(editItem.router_id || ""), status: editItem.status || "active",
        notes: editItem.notes || "",
      })
    } else {
      setForm(emptyForm)
    }
  }, [editItem, dialogOpen])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = {
        ...form,
        latitude: parseFloat(form.latitude) || 0,
        longitude: parseFloat(form.longitude) || 0,
        capacity: parseInt(form.capacity) || 16,
        port_used: parseInt(form.port_used) || 0,
        router_id: parseInt(form.router_id) || null,
      }
      if (editItem) await api.put(`/odc/${editItem.id}`, payload)
      else await api.post("/odc", payload)
      setDialogOpen(false); fetchData()
    } catch (err: any) { alert(err.response?.data?.error || "Gagal") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus ODC? ODP terkait akan kehilangan referensi.")) return
    try { await api.delete(`/odc/${id}`); fetchData() } catch {}
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama/kode..."
              className="pl-8 w-64"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </div>
        <Button onClick={() => { setEditItem(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Tambah ODC
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead>Kapasitas</TableHead>
                <TableHead>Terpakai</TableHead>
                <TableHead>Router</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Belum ada ODC</TableCell></TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="font-mono text-xs">{item.code}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.address || "-"}</TableCell>
                    <TableCell>{item.capacity}</TableCell>
                    <TableCell>{item.port_used}</TableCell>
                    <TableCell>{item.router_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "active" ? "default" : "secondary"}>
                        {item.status === "active" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(item); setDialogOpen(true) }}><Edit className="h-4 w-4" /></Button>
                        {currentUser?.role === "superadmin" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Total: {total} ODC</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="flex items-center text-sm px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? "Edit ODC" : "Tambah ODC"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama *</label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kode *</label>
                <Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} required />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Alamat</label>
                <Input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Latitude</label>
                <Input value={form.latitude} onChange={(e) => setForm(p => ({ ...p, latitude: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Longitude</label>
                <Input value={form.longitude} onChange={(e) => setForm(p => ({ ...p, longitude: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kapasitas</label>
                <Input type="number" value={form.capacity} onChange={(e) => setForm(p => ({ ...p, capacity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Port Terpakai</label>
                <Input type="number" value={form.port_used} onChange={(e) => setForm(p => ({ ...p, port_used: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Router ID</label>
                <Input type="number" value={form.router_id} onChange={(e) => setForm(p => ({ ...p, router_id: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Catatan</label>
                <Input value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
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
