import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send, Save, Loader2 } from "lucide-react"

const providers: Record<string, { name: string; needs_session: boolean; fields: string[] }> = {
  openwa:     { name: "OpenWA", needs_session: true, fields: ["url (full, ex: http://ip:3000)", "API Key"] },
  fonnte:    { name: "Fonnte", needs_session: false, fields: ["(token) — disimpan di API Key", "API Key"] },
  wablas:    { name: "Wablas", needs_session: false, fields: ["URL server Wablas", "Token"] },
  twilio:    { name: "Twilio", needs_session: true, fields: ["Account SID", "Auth Token"] },
  wabusiness: { name: "WA Business API", needs_session: false, fields: ["Phone Number ID", "Permanent Access Token"] },
}

export function WaSettings() {
  const [provider, setProvider] = useState("openwa")
  const [apiUrl, setApiUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [sessionName, setSessionName] = useState("billing")
  const [testPhone, setTestPhone] = useState("")
  const [testMessage, setTestMessage] = useState("Test dari U-One Radius")
  const [testResult, setTestResult] = useState("")
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    api.get("/settings")
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || []
        const findVal = (key: string) => data.find((s: any) => s.key === key)?.value || ""
        setProvider(findVal("wa_provider") || "openwa")
        setApiUrl(findVal("wa_api_url") || "")
        setApiKey(findVal("wa_api_key") || "")
        setSessionName(findVal("wa_session") || "billing")
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const settings = [
        { key: "wa_provider", value: provider, category: "wa" },
        { key: "wa_api_url", value: apiUrl, category: "wa" },
        { key: "wa_api_key", value: apiKey, category: "wa" },
      ]
      if (providers[provider]?.needs_session) {
        settings.push({ key: "wa_session", value: sessionName, category: "wa" })
      }
      await api.put("/settings", { settings })
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

  if (!loaded) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const prov = providers[provider] || providers.openwa

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">WhatsApp Gateway</h2>
        <p className="text-sm text-muted-foreground">Konfigurasi multi-provider WA gateway</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Provider & Konfigurasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              {Object.entries(providers).map(([k, v]) => (
                <option key={k} value={k}>{v.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              {provider === "openwa" && "Self-hosted OpenWA. Butuh URL server + API Key + session name."}
              {provider === "fonnte" && "Fonnte.com. API Key = token Fonnte. Nomor HP otomatis pake 62."}
              {provider === "wablas" && "Self-hosted Wablas. Butuh URL server + token."}
              {provider === "twilio" && "Twilio API. API URL = Account SID, Session = From number (with country code)."}
              {provider === "wabusiness" && "Meta WA Business API. API URL = Phone Number ID, API Key = Permanent Access Token."}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">API URL {prov.fields[0]}</label>
            <Input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder={
                provider === "openwa" ? "http://10.10.33.52:3000" :
                provider === "twilio" ? "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" :
                provider === "wabusiness" ? "123456789012345" :
                "http://your-server:port"
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{prov.fields[1]}</label>
            <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="***" />
          </div>

          {prov.needs_session && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {provider === "twilio" ? "From Number (with country code)" : "Session Name"}
              </label>
              <Input value={sessionName} onChange={(e) => setSessionName(e.target.value)} placeholder={provider === "twilio" ? "14155238886" : "billing"} />
            </div>
          )}

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
