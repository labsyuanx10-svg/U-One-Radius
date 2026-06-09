import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

interface Option {
  id: number
  name: string
}

interface FormData {
  name: string
  phone: string
  email: string
  nik: string
  address: string
  group_id: string
  plan_id: string
  username_radius: string
  password_radius: string
  device_merk: string
  device_serial: string
  coordinates: string
}

export function CustomerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState<FormData>({
    name: "", phone: "", email: "", nik: "", address: "",
    group_id: "", plan_id: "", username_radius: "", password_radius: "",
    device_merk: "", device_serial: "", coordinates: "",
  })
  const [groups, setGroups] = useState<Option[]>([])
  const [plans, setPlans] = useState<Option[]>([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gRes, pRes] = await Promise.all([
          api.get("/groups").catch(() => ({ data: [] })),
          api.get("/plans").catch(() => ({ data: [] })),
        ])
        setGroups(Array.isArray(gRes.data) ? gRes.data : gRes.data?.data || [])
        setPlans(Array.isArray(pRes.data) ? pRes.data : pRes.data?.data || [])
        if (isEdit) {
          const cRes = await api.get(`/customers/${id}`)
          const c = cRes.data?.data || cRes.data
          setForm({
            name: c.name || "",
            phone: c.phone || "",
            email: c.email || "",
            nik: c.nik || "",
            address: c.address || "",
            group_id: String(c.group_id || ""),
            plan_id: String(c.plan_id || ""),
            username_radius: c.username_radius || "",
            password_radius: "",
            device_merk: c.device_merk || "",
            device_serial: c.device_serial || "",
            coordinates: c.coordinates || "",
          })
        }
      } catch {}
      setLoading(false)
    }
    fetchData()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form }
      if (!isEdit) {
        payload.password_radius = payload.password_radius || "changeme123"
      }
      if (isEdit) {
        await api.put(`/customers/${id}`, payload)
      } else {
        await api.post("/customers", payload)
      }
      navigate("/customers")
    } catch (err: any) {
      alert(err.response?.data?.message || "Gagal menyimpan data")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{isEdit ? "Edit Pelanggan" : "Tambah Pelanggan"}</h2>
          <p className="text-sm text-muted-foreground">
            {isEdit ? "Ubah data pelanggan" : "Input pelanggan baru"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Pelanggan</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Nama Lengkap <span className="text-destructive">*</span></label>
                <Input name="name" value={form.name} onChange={handleChange} required placeholder="Nama pelanggan" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">No. HP</label>
                <Input name="phone" value={form.phone} onChange={handleChange} placeholder="08123456789" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">NIK</label>
                <Input name="nik" value={form.nik} onChange={handleChange} placeholder="Nomor KTP" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Group</label>
                <Select value={form.group_id} onValueChange={(v) => setForm((p) => ({ ...p, group_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Alamat</label>
                <Input name="address" value={form.address} onChange={handleChange} placeholder="Alamat lengkap" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Paket Internet</label>
                <Select value={form.plan_id} onValueChange={(v) => setForm((p) => ({ ...p, plan_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Koordinat</label>
                <Input name="coordinates" value={form.coordinates} onChange={handleChange} placeholder="-6.2088,106.8456" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username PPPoE</label>
                <Input name="username_radius" value={form.username_radius} onChange={handleChange} placeholder="pppoe_user" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Password PPPoE {!isEdit && <span className="text-destructive">*</span>}
                </label>
                <Input
                  name="password_radius"
                  type="text"
                  value={form.password_radius}
                  onChange={handleChange}
                  placeholder={isEdit ? "(biarkan kosong jika tidak diubah)" : "password123"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Merk ONT/Modem</label>
                <Input name="device_merk" value={form.device_merk} onChange={handleChange} placeholder="FiberHome" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Serial ONT</label>
                <Input name="device_serial" value={form.device_serial} onChange={handleChange} placeholder="SN123456" />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                {isEdit ? "Simpan Perubahan" : "Simpan"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/customers")}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
