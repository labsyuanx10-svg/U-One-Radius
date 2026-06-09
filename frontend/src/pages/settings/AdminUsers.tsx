import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Shield, Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

const roleColors: Record<string, "default" | "secondary" | "info" | "warning"> = {
  superadmin: "default",
  admin: "info",
  auditor: "warning",
}

const roleLabels: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  auditor: "Auditor",
}

interface AdminUser {
  id: number
  username: string
  fullname: string
  email: string
  phone: string
  role: string
  group_id: number | null
  group_name: string
  status: string
  last_login: string | null
}

export function AdminUsers() {
  const { user } = useAuthStore()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<AdminUser | null>(null)
  const [form, setForm] = useState({ username: "", password: "", fullname: "", email: "", phone: "", role: "admin", group_id: "", status: "active" })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [aRes, gRes] = await Promise.all([
        api.get("/admin-users").catch(() => ({ data: { data: [] } })),
        api.get("/groups").catch(() => ({ data: [] })),
      ])
      setAdmins(aRes.data?.data || [])
      setGroups(Array.isArray(gRes.data) ? gRes.data : gRes.data?.data || [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (editItem) {
      setForm({
        username: editItem.username,
        password: "",
        fullname: editItem.fullname,
        email: editItem.email || "",
        phone: editItem.phone || "",
        role: editItem.role,
        group_id: String(editItem.group_id || ""),
        status: editItem.status,
      })
    } else {
      setForm({ username: "", password: "", fullname: "", email: "", phone: "", role: "admin", group_id: "", status: "active" })
    }
  }, [editItem, dialogOpen])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, group_id: form.group_id ? Number(form.group_id) : null }
      if (editItem) {
        await api.put(`/admin-users/${editItem.id}`, payload)
      } else {
        await api.post("/admin-users", payload)
      }
      fetchData()
      setDialogOpen(false)
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyimpan")
    }
    setSaving(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus admin ini?")) return
    try {
      await api.delete(`/admin-users/${id}`)
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menghapus")
    }
  }

  if (user?.role !== "superadmin") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Users</h2>
          <p className="text-sm text-muted-foreground">Hanya superadmin yang bisa mengelola admin</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Shield className="h-12 w-12 mb-4 opacity-30" />
            <p>Akses terbatas. Hubungi superadmin.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Users</h2>
          <p className="text-sm text-muted-foreground">Kelola user admin, operator, dan auditor</p>
        </div>
        <Button onClick={() => { setEditItem(null); setDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />Tambah Admin
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terakhir Login</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Memuat...</TableCell></TableRow>
              ) : admins.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Belum ada admin</TableCell></TableRow>
              ) : (
                admins.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs font-medium">{a.username}</TableCell>
                    <TableCell className="font-medium">{a.fullname}</TableCell>
                    <TableCell>{a.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={roleColors[a.role] || "secondary"}>{roleLabels[a.role] || a.role}</Badge>
                    </TableCell>
                    <TableCell>{a.group_name || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === "active" ? "success" : "secondary"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.last_login ? new Date(a.last_login).toLocaleString("id-ID") : "Belum pernah"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditItem(a); setDialogOpen(true) }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editItem ? "Edit Admin" : "Tambah Admin"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username <span className="text-destructive">*</span></label>
                <Input value={form.username} onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password {!editItem && <span className="text-destructive">*</span>}</label>
                <Input type="text" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} placeholder={editItem ? "(kosongkan jika tidak diubah)" : ""} />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-medium">Nama Lengkap <span className="text-destructive">*</span></label>
                <Input value={form.fullname} onChange={(e) => setForm(p => ({ ...p, fullname: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <select value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="teknisi">Teknisi</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Group</label>
                <select value={form.group_id} onChange={(e) => setForm(p => ({ ...p, group_id: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Semua Group</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telepon</label>
                <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editItem ? "Simpan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
