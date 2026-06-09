import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Save, User } from "lucide-react"

interface Profile {
  id: number; uid: string; username: string; fullname: string
  email: string; phone: string; role: string; last_login: string
}

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    api.get("/profile")
      .then((res) => setProfile(res.data?.data || res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      alert("Password baru dan konfirmasi tidak cocok")
      return
    }
    if (newPassword.length < 6) {
      alert("Password baru minimal 6 karakter")
      return
    }
    setSaving(true)
    try {
      await api.put("/profile/password", {
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })
      alert("Password berhasil diubah")
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      alert(err.response?.data?.error || "Gagal mengubah password")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <User className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Profil</h2>
          <p className="text-sm text-muted-foreground">Info akun dan pengaturan password</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Info Akun</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nama Lengkap</label>
              <p className="font-medium">{profile?.fullname || "-"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Username</label>
              <p className="font-medium">{profile?.username || "-"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <p className="font-medium">{profile?.email || "-"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">No. HP</label>
              <p className="font-medium">{profile?.phone || "-"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Role</label>
              <p className="font-medium capitalize">{profile?.role || "-"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Terakhir Login</label>
              <p className="font-medium">{profile?.last_login ? new Date(profile.last_login).toLocaleString("id-ID") : "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ganti Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Password Lama</label>
              <Input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Password saat ini"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password Baru</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Konfirmasi Password Baru</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                required
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Simpan Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
