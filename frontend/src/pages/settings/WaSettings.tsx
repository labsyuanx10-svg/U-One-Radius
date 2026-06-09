import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Save, Loader2, ExternalLink } from "lucide-react"

export function WaSettings() {
  const [apiUrl, setApiUrl] = useState("http://openwa-api:3000")
  const [apiKey, setApiKey] = useState("")
  const [sessionName, setSessionName] = useState("billing")
  const [testPhone, setTestPhone] = useState("")
  const [testMessage, setTestMessage] = useState("Test dari U-One Radius")
  const [testResult, setTestResult] = useState("")
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get("/settings")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || []
        const findVal = (key: string) => data.find((s: any) => s.key === key)?.value || ""
        setApiUrl(findVal("wa_api_url") || "http://openwa-api:3000")
        setApiKey(findVal("wa_api_key") || "")
        setSessionName(findVal("wa_session") || "billing")
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put("/settings", {
        settings: [
          { key: "wa_api_url", value: apiUrl, category: "wa" },
          { key: "wa_api_key", value: apiKey, category: "wa" },
          { key: "wa_session", value: sessionName, category: "wa" },
        ],
      })
      alert("Pengaturan WA disimpan")
    } catch { alert("Gagal menyimpan") }
    finally { setSaving(false) }
  }

  const handleTest = async () => {
    if (!testPhone) return
    setTesting(true)
    setTestResult("")
    try {
      const res = await api.post("/wa/test", {
        api_url: apiUrl,
        api_key: apiKey,
        session: sessionName,
        phone: testPhone,
        message: testMessage,
      })
      setTestResult(`✅ Berhasil: ${res.data?.message || "OK"}`)
    } catch (err: any) {
      setTestResult(`❌ Gagal: ${err.response?.data?.message || err.message}`)
    }
    finally { setTesting(false) }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">WhatsApp Gateway</h2>
          <p className="text-sm text-muted-foreground">Konfigurasi integrasi OpenWA</p>
        </div>
        <a href="http://10.10.33.52:3001" target="_blank" rel="noopener noreferrer">
          <Button variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />Buka Dashboard OpenWA
          </Button>
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Konfigurasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API URL</label>
            <Input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="http://openwa-api:3000" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key</label>
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API Key OpenWA" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Name</label>
            <Input value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder="billing" />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />Simpan Pengaturan
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Test Kirim WA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">No. HP Tujuan</label>
            <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="628123456789" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Pesan</label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button onClick={handleTest} disabled={testing} variant="secondary">
            {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />Kirim Test
          </Button>
          {testResult && (
            <div className={`rounded-lg p-3 text-sm ${testResult.startsWith("✅") ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
              {testResult}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
