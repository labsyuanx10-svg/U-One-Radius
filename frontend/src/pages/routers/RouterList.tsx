import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"

interface Router {
  id: number; name: string; ip_address: string; secret: string
  type: string; group_id: number | null; group_name?: string
}

export function RouterList() {
  const [routers, setRouters] = useState<Router[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Router | null>(null)
  const [form, setForm] = useState({ name: "", ip_address: "", secret: "", type: "pppoe", group_id: "" })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get("/routers")
      setRouters(Array.isArray(res.data) ? res.data : res.data?.data || [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (editItem) setForm({ name: editItem.name, ip_address: editItem.ip_address, secret: editItem.secret, type: editItem.type, group_id: String(editItem.group_id || "") })
    else setForm({ name: "", ip_address: "", secret: "", type: "pppoe", group_id: "" })
  }, [editItem, dialogOpen])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, group_id: Number(form.group_id) || null }
      if (editItem) await api.put(`/routers/${editItem.id}`, payload)
      else await api.post("/routers", payload)
      fetchData(); setDialogOpen(false)
    } catch (err: any) { alert(err.response?.data?.message || "Gagal") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus router?")) return
    try { await api.delete(`/routers/${id}`); fetchData() } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Router</h2>
          <p className="text-sm text-muted-foreground">Kelola router MikroTik (RADIUS client)</p>
        </div>
        <Button onClick={() => { setEditItem(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Tambah Router
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Secret</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : routers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Belum ada router</TableCell></TableRow>
              ) : (
                routers.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-xs">{r.ip_address}</TableCell>
                    <TableCell className="font-mono text-xs">{r.secret}</TableCell>
                    <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                    <TableCell>{r.group_name || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(r); setDialogOpen(true) }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editItem ? "Edit Router" : "Tambah Router"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Router</label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">IP Address</label>
                <Input value={form.ip_address} onChange={(e) => setForm(p => ({ ...p, ip_address: e.target.value }))} required placeholder="10.10.10.1" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Secret</label>
                <Input value={form.secret} onChange={(e) => setForm(p => ({ ...p, secret: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipe</label>
                <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="pppoe">PPPoE</option>
                  <option value="hotspot">Hotspot</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Group ID</label>
                <Input type="number" value={form.group_id} onChange={(e) => setForm(p => ({ ...p, group_id: e.target.value }))} />
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
