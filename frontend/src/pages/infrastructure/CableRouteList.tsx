import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

interface CableForm {
  name: string; type: string; odc_id: string; odp_id: string
  coordinates: string; distance_km: string; notes: string
}

const emptyForm: CableForm = {
  name: "", type: "distribution", odc_id: "", odp_id: "",
  coordinates: "[]", distance_km: "0", notes: "",
}

export function CableRouteList() {
  const [items, setItems] = useState<any[]>([])
  const [odcs, setOdcs] = useState<any[]>([])
  const [odps, setOdps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<any | null>(null)
  const [form, setForm] = useState<CableForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const currentUser = useAuthStore((s) => s.user)
  const limit = 15

  const fetchData = async (p = page) => {
    setLoading(true)
    try {
      const res = await api.get("/cable-routes", { params: { page: p, limit } })
      setItems(res.data?.data || [])
      setTotal(res.data?.total || 0)
    } catch {}
    setLoading(false)
  }

  const fetchRefs = async () => {
    try {
      const [oRes, pRes] = await Promise.all([
        api.get("/odc", { params: { limit: 200 } }),
        api.get("/odp", { params: { limit: 200 } }),
      ])
      setOdcs(oRes.data?.data || [])
      setOdps(pRes.data?.data || [])
    } catch {}
  }

  useEffect(() => { fetchRefs() }, [])
  useEffect(() => { fetchData() }, [page])

  useEffect(() => {
    if (editItem) {
      let coords = editItem.coordinates || "[]"
      if (typeof coords === "object") coords = JSON.stringify(coords)
      setForm({
        name: editItem.name || "", type: editItem.type || "distribution",
        odc_id: String(editItem.odc_id || ""), odp_id: String(editItem.odp_id || ""),
        coordinates: coords, distance_km: String(editItem.distance_km || "0"),
        notes: editItem.notes || "",
      })
    } else {
      setForm(emptyForm)
    }
  }, [editItem, dialogOpen])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      let coords = form.coordinates
      try { coords = JSON.parse(form.coordinates) } catch {}

      const payload = {
        name: form.name,
        type: form.type,
        odc_id: parseInt(form.odc_id) || null,
        odp_id: parseInt(form.odp_id) || null,
        coordinates: coords,
        distance_km: parseFloat(form.distance_km) || 0,
        notes: form.notes,
      }
      if (editItem) await api.put(`/cable-routes/${editItem.id}`, payload)
      else await api.post("/cable-routes", payload)
      setDialogOpen(false); fetchData()
    } catch (err: any) { alert(err.response?.data?.error || "Gagal") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus cable route?")) return
    try { await api.delete(`/cable-routes/${id}`); fetchData() } catch {}
  }

  const totalPages = Math.ceil(total / limit)

  const typeBadge: Record<string, string> = { feeder: "destructive", distribution: "warning", drop: "secondary" }
  const typeLabel: Record<string, string> = { feeder: "Feeder", distribution: "Distribution", drop: "Drop" }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total: {total} rute kabel</p>
        </div>
        <Button onClick={() => { setEditItem(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Tambah Rute
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>ODC</TableHead>
                <TableHead>ODP</TableHead>
                <TableHead>Jarak (km)</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Belum ada rute kabel</TableCell></TableRow>
              ) : (
                items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <Badge variant={(typeBadge[item.type] || "outline") as any}>
                        {typeLabel[item.type] || item.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.odc_name || "-"}</TableCell>
                    <TableCell>{item.odp_name || "-"}</TableCell>
                    <TableCell>{item.distance_km}</TableCell>
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
          <p className="text-sm text-muted-foreground">Total: {total} rute</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="flex items-center text-sm px-2">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? "Edit Rute Kabel" : "Tambah Rute Kabel"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama *</label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe</label>
                <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="feeder">Feeder</option>
                  <option value="distribution">Distribution</option>
                  <option value="drop">Drop</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ODC</label>
                <select value={form.odc_id} onChange={(e) => setForm(p => ({ ...p, odc_id: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Pilih ODC</option>
                  {odcs.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.code} - {o.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ODP</label>
                <select value={form.odp_id} onChange={(e) => setForm(p => ({ ...p, odp_id: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Pilih ODP</option>
                  {odps.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jarak (km)</label>
                <Input type="number" step="0.001" value={form.distance_km} onChange={(e) => setForm(p => ({ ...p, distance_km: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Koordinat (JSON)</label>
              <textarea
                value={form.coordinates}
                onChange={(e) => setForm(p => ({ ...p, coordinates: e.target.value }))}
                rows={4}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
                placeholder='[[lat1,lng1],[lat2,lng2],...]'
              />
              <p className="text-xs text-muted-foreground">Format: array of [latitude, longitude] pairs. Contoh: [[-6.2,106.8],[-6.21,106.81]]</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan</label>
              <Input value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} />
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
