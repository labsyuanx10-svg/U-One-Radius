import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Loader2, Layers } from "lucide-react"

interface Group {
  id: number; code: string; name: string; address: string
  phone: string; email: string
}

export function GroupList() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Group | null>(null)
  const [form, setForm] = useState({ code: "", name: "", address: "", phone: "", email: "" })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get("/groups")
      setGroups(Array.isArray(res.data) ? res.data : res.data?.data || [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (editItem) setForm({ code: editItem.code, name: editItem.name, address: editItem.address || "", phone: editItem.phone || "", email: editItem.email || "" })
    else setForm({ code: "", name: "", address: "", phone: "", email: "" })
  }, [editItem, dialogOpen])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editItem) await api.put(`/groups/${editItem.id}`, form)
      else await api.post("/groups", form)
      fetchData(); setDialogOpen(false)
    } catch (err: any) { alert(err.response?.data?.message || "Gagal") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus group?")) return
    try { await api.delete(`/groups/${id}`); fetchData() } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Group</h2>
          <p className="text-sm text-muted-foreground">Kelola group/cabang</p>
        </div>
        <Button onClick={() => { setEditItem(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Tambah Group
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Alamat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : groups.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Belum ada group</TableCell></TableRow>
              ) : (
                groups.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-mono text-xs font-medium">{g.code}</TableCell>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>{g.phone || "-"}</TableCell>
                    <TableCell>{g.email || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{g.address || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(g); setDialogOpen(true) }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(g.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editItem ? "Edit Group" : "Tambah Group"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Kode</label>
                <Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))} required placeholder="CAB01" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telepon</label>
                <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Alamat</label>
                <Input value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} />
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
