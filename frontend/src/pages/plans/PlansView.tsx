import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Wifi, Loader2 } from "lucide-react"

/* ──────────────── Plan Types ──────────────── */
interface Plan {
  id: number; name: string; type: string; price: number
  bandwidth_down: number; bandwidth_up: number; burst_down: number
  burst_up: number; duration_days: number; ip_pool_id: number | null
  pool_name?: string
}
interface Pool {
  id: number; name: string; range_ip: string; gateway: string
  dns1?: string; dns2?: string; router_id?: number; router_name?: string
}

/* ──────────────── Plan Form Component ──────────────── */
function PlanDialog({ open, onOpenChange, plan, pools, onSave }: {
  open: boolean; onOpenChange: (o: boolean) => void
  plan?: Plan | null; pools: Pool[]; onSave: () => void
}) {
  const [form, setForm] = useState({ name: "", type: "pppoe", price: "", bandwidth_down: "", bandwidth_up: "", burst_down: "", burst_up: "", duration_days: "30", ip_pool_id: "" })
  const [saving, setSaving] = useState(false)
  const isEdit = Boolean(plan)

  useEffect(() => {
    if (plan) {
      setForm({
        name: plan.name, type: plan.type, price: String(plan.price),
        bandwidth_down: String(plan.bandwidth_down), bandwidth_up: String(plan.bandwidth_up),
        burst_down: String(plan.burst_down || ""), burst_up: String(plan.burst_up || ""),
        duration_days: String(plan.duration_days), ip_pool_id: String(plan.ip_pool_id || ""),
      })
    } else {
      setForm({ name: "", type: "pppoe", price: "", bandwidth_down: "", bandwidth_up: "", burst_down: "", burst_up: "", duration_days: "30", ip_pool_id: "" })
    }
  }, [plan, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, price: Number(form.price), bandwidth_down: Number(form.bandwidth_down), bandwidth_up: Number(form.bandwidth_up), burst_down: Number(form.burst_down) || 0, burst_up: Number(form.burst_up) || 0, duration_days: Number(form.duration_days), ip_pool_id: Number(form.ip_pool_id) || null }
      if (isEdit) await api.put(`/plans/${plan!.id}`, payload)
      else await api.post("/plans", payload)
      onSave()
      onOpenChange(false)
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal simpan")
    } finally { setSaving(false) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Paket" : "Tambah Paket"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Nama Paket</label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="contoh: 10Mbps" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe</label>
              <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="pppoe">PPPoE</option>
                <option value="hotspot">Hotspot</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Harga (Rp)</label>
              <Input type="number" value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">BW Down (Mbps)</label>
              <Input type="number" value={form.bandwidth_down} onChange={(e) => setForm(p => ({ ...p, bandwidth_down: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">BW Up (Mbps)</label>
              <Input type="number" value={form.bandwidth_up} onChange={(e) => setForm(p => ({ ...p, bandwidth_up: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Burst Down</label>
              <Input type="number" value={form.burst_down} onChange={(e) => setForm(p => ({ ...p, burst_down: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Burst Up</label>
              <Input type="number" value={form.burst_up} onChange={(e) => setForm(p => ({ ...p, burst_up: e.target.value }))} placeholder="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Durasi (hari)</label>
              <Input type="number" value={form.duration_days} onChange={(e) => setForm(p => ({ ...p, duration_days: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">IP Pool</label>
              <select value={form.ip_pool_id} onChange={(e) => setForm(p => ({ ...p, ip_pool_id: e.target.value }))} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="">Tidak ada</option>
                {pools.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ──────────────── Plans View ──────────────── */
export function PlansView() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPlan, setEditPlan] = useState<Plan | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [plRes, poRes] = await Promise.all([
        api.get("/plans").catch(() => ({ data: [] })),
        api.get("/ip-pools").catch(() => ({ data: [] })),
      ])
      setPlans(Array.isArray(plRes.data) ? plRes.data : plRes.data?.data || [])
      setPools(Array.isArray(poRes.data) ? poRes.data : poRes.data?.data || [])
    } catch {}
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus paket ini?")) return
    try { await api.delete(`/plans/${id}`); fetchData() } catch {}
  }

  const openEdit = (plan: Plan) => { setEditPlan(plan); setDialogOpen(true) }
  const openAdd = () => { setEditPlan(null); setDialogOpen(true) }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Paket & IP Pool</h2>
          <p className="text-sm text-muted-foreground">Kelola paket internet dan IP pool</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />Tambah Paket
        </Button>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">Paket Internet</TabsTrigger>
          <TabsTrigger value="pools">IP Pool</TabsTrigger>
        </TabsList>
        <TabsContent value="plans">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Paket</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>BW Down</TableHead>
                    <TableHead>BW Up</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Pool</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Memuat...</TableCell></TableRow>
                  ) : plans.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Belum ada paket</TableCell></TableRow>
                  ) : (
                    plans.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell><Badge variant="outline">{p.type}</Badge></TableCell>
                        <TableCell>{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(p.price)}</TableCell>
                        <TableCell>{p.bandwidth_down} Mbps</TableCell>
                        <TableCell>{p.bandwidth_up} Mbps</TableCell>
                        <TableCell>{p.duration_days} hari</TableCell>
                        <TableCell>{p.pool_name || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pools">
          <PoolList pools={pools} onRefresh={fetchData} />
        </TabsContent>
      </Tabs>

      <PlanDialog open={dialogOpen} onOpenChange={setDialogOpen} plan={editPlan} pools={pools} onSave={fetchData} />
    </div>
  )
}

/* ──────────────── Pool List ──────────────── */
function PoolList({ pools, onRefresh }: { pools: Pool[]; onRefresh: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editPool, setEditPool] = useState<Pool | null>(null)
  const [form, setForm] = useState({ name: "", range_ip: "", gateway: "", dns1: "", dns2: "", router_id: "" })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editPool) setForm({ name: editPool.name, range_ip: editPool.range_ip, gateway: editPool.gateway, dns1: editPool.dns1 || "", dns2: editPool.dns2 || "", router_id: String(editPool.router_id || "") })
    else setForm({ name: "", range_ip: "", gateway: "", dns1: "", dns2: "", router_id: "" })
  }, [editPool, dialogOpen])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, router_id: Number(form.router_id) || null }
      if (editPool) await api.put(`/ip-pools/${editPool.id}`, payload)
      else await api.post("/ip-pools", payload)
      onRefresh(); setDialogOpen(false)
    } catch (err: any) { alert(err.response?.data?.message || "Gagal simpan") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus pool ini?")) return
    try { await api.delete(`/ip-pools/${id}`); onRefresh() } catch {}
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">IP Pool</CardTitle>
            <Button size="sm" onClick={() => { setEditPool(null); setDialogOpen(true) }}><Plus className="mr-2 h-4 w-4" />Tambah Pool</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Range IP</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>DNS</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pools.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Belum ada IP pool</TableCell></TableRow>
              ) : (
                pools.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.range_ip}</TableCell>
                    <TableCell className="font-mono text-xs">{p.gateway}</TableCell>
                    <TableCell className="font-mono text-xs">{p.dns1 || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditPool(p); setDialogOpen(true) }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
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
          <DialogHeader><DialogTitle>{editPool ? "Edit IP Pool" : "Tambah IP Pool"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Pool</label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Range IP</label>
              <Input value={form.range_ip} onChange={(e) => setForm(p => ({ ...p, range_ip: e.target.value }))} required placeholder="192.168.1.1-192.168.1.254" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Gateway</label>
                <Input value={form.gateway} onChange={(e) => setForm(p => ({ ...p, gateway: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Router ID</label>
                <Input type="number" value={form.router_id} onChange={(e) => setForm(p => ({ ...p, router_id: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">DNS 1</label>
                <Input value={form.dns1} onChange={(e) => setForm(p => ({ ...p, dns1: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">DNS 2</label>
                <Input value={form.dns2} onChange={(e) => setForm(p => ({ ...p, dns2: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
