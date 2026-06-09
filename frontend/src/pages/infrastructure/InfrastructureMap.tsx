import { useEffect, useState, useCallback } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import api from "@/lib/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Edit3, Loader2, Check } from "lucide-react"

// Fix default marker icon path in bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

function createColoredIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 12 24 12 24s12-17.373 12-24C24 5.373 18.627 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#fff"/>
  </svg>`
  return L.divIcon({
    html: svg,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
    className: "",
  })
}

const iconRouter = createColoredIcon("#ef4444")
const iconOdc = createColoredIcon("#3b82f6")
const iconOdp = createColoredIcon("#22c55e")

const cableColor: Record<string, string> = {
  feeder: "#ef4444",
  distribution: "#eab308",
  drop: "#ffffff",
}

interface Router {
  id: number; name: string; ip_address: string; latitude?: number; longitude?: number; status: string; notes?: string
}

interface Odc {
  id: number; name: string; code: string; latitude: string; longitude: string
  capacity: number; port_used: number; status: string; address?: string; router_name?: string
}

interface Odp {
  id: number; name: string; code: string; latitude: string; longitude: string
  capacity: number; port_used: number; status: string; address?: string; odc_name?: string
}

interface CableRoute {
  id: number; name: string; type: string; coordinates: string; distance_km: string
  odc_name?: string; odp_name?: string
}

interface MapData {
  routers: Router[]
  odcs: Odc[]
  odps: Odp[]
  cables: CableRoute[]
}

interface EditTarget {
  id: number
  type: "router" | "odc" | "odp"
  name: string
  currentNote: string
}

function hasCoords(item: any): item is { latitude: string | number; longitude: string | number } {
  const lat = parseFloat(String(item.latitude))
  const lng = parseFloat(String(item.longitude))
  return !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)
}

function FitBoundsOnData({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [points, map])
  return null
}

// ── Click handler: capture map clicks and open add-marker dialog ──
function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// ── Add marker modal content (shared between Dialog and Sheet) ──
function AddMarkerForm({
  lat,
  lng,
  onSave,
  onCancel,
  saving,
}: {
  lat: number
  lng: number
  onSave: (name: string, type: "Router" | "ODC" | "ODP", notes: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"Router" | "ODC" | "ODP">("Router")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), type, notes.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nama</label>
        <Input
          placeholder="Nama titik..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Tipe</label>
        <Select value={type} onValueChange={(v) => setType(v as "Router" | "ODC" | "ODP")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Router">Router</SelectItem>
            <SelectItem value="ODC">ODC</SelectItem>
            <SelectItem value="ODP">ODP</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Catatan</label>
        <textarea
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
          placeholder="Catatan opsional..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div className="text-xs text-muted-foreground">
        Koordinat: {lat.toFixed(6)}, {lng.toFixed(6)}
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Batal
        </Button>
        <Button type="submit" size="sm" disabled={saving || !name.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          Simpan
        </Button>
      </div>
    </form>
  )
}

// ── Edit note form (used inside edit dialog) ──
function EditNoteForm({
  target,
  onSave,
  onCancel,
  saving,
}: {
  target: EditTarget
  onSave: (note: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const [note, setNote] = useState(target.currentNote)

  return (
    <div className="space-y-4">
      <div className="text-sm">
        <span className="font-medium">{target.name}</span>
        <span className="text-muted-foreground ml-2">({target.type})</span>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Catatan</label>
        <textarea
          className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
          placeholder={target.type === "router" ? "Catatan router..." : "Alamat / catatan..."}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={saving}>
          Batal
        </Button>
        <Button type="button" size="sm" onClick={() => onSave(note)} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
          Simpan
        </Button>
      </div>
    </div>
  )
}

// ── Main component ──
export function InfrastructureMap() {
  const [data, setData] = useState<MapData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  // Add-marker state
  const [clickLatLng, setClickLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit-note state
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [editing, setEditing] = useState(false)

  // Instruction banner visibility
  const [showInstruction, setShowInstruction] = useState(true)

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rRes, oRes, pRes, cRes] = await Promise.all([
        api.get("/routers"),
        api.get("/odc"),
        api.get("/odp"),
        api.get("/cable-routes"),
      ])
      setData({
        routers: Array.isArray(rRes.data) ? rRes.data : rRes.data?.data || [],
        odcs: Array.isArray(oRes.data) ? oRes.data : oRes.data?.data || [],
        odps: Array.isArray(pRes.data) ? pRes.data : pRes.data?.data || [],
        cables: Array.isArray(cRes.data) ? cRes.data : cRes.data?.data || [],
      })
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshKey])

  // Map click handler
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickLatLng({ lat, lng })
    setShowAddModal(true)
    setShowInstruction(false)
  }, [])

  // Add marker save
  const handleAddSave = useCallback(async (name: string, type: "Router" | "ODC" | "ODP", notes: string) => {
    if (!clickLatLng) return
    setSaving(true)
    try {
      const coords = { latitude: clickLatLng.lat, longitude: clickLatLng.lng }
      if (type === "Router") {
        await api.post("/routers", {
          name,
          ip_address: "",
          status: "active",
          ...coords,
          notes: notes || "",
        })
      } else if (type === "ODC") {
        await api.post("/odc", {
          name,
          code: name,
          capacity: 0,
          port_used: 0,
          status: "active",
          ...coords,
          address: notes || "",
        })
      } else {
        // ODP
        await api.post("/odp", {
          name,
          code: name,
          capacity: 0,
          port_used: 0,
          status: "active",
          ...coords,
          address: notes || "",
        })
      }
      setShowAddModal(false)
      setClickLatLng(null)
      setRefreshKey((k) => k + 1)
    } catch {}
    setSaving(false)
  }, [clickLatLng])

  // Edit note save
  const handleEditSave = useCallback(async (note: string) => {
    if (!editTarget) return
    setEditing(true)
    try {
      if (editTarget.type === "router") {
        await api.put(`/routers/${editTarget.id}`, { notes: note })
      } else if (editTarget.type === "odc") {
        await api.put(`/odc/${editTarget.id}`, { address: note })
      } else {
        await api.put(`/odp/${editTarget.id}`, { address: note })
      }
      setEditTarget(null)
      setRefreshKey((k) => k + 1)
    } catch {}
    setEditing(false)
  }, [editTarget])

  const handleMarkerEdit = useCallback((target: EditTarget) => {
    setEditTarget(target)
  }, [])

  // Collect all coordinate points for fitBounds
  const allPoints: [number, number][] = data
    ? [
        ...data.routers.filter(hasCoords).map((r) => [parseFloat(String(r.latitude)), parseFloat(String(r.longitude))] as [number, number]),
        ...data.odcs.filter(hasCoords).map((o) => [parseFloat(String(o.latitude)), parseFloat(String(o.longitude))] as [number, number]),
        ...data.odps.filter(hasCoords).map((p) => [parseFloat(String(p.latitude)), parseFloat(String(p.longitude))] as [number, number]),
        ...data.cables.flatMap((c) => {
          try {
            const raw: number[][] = typeof c.coordinates === "string" ? JSON.parse(c.coordinates) : c.coordinates
            return Array.isArray(raw) ? raw.filter((pt) => Array.isArray(pt) && pt.length >= 2).map((pt) => [pt[0], pt[1]] as [number, number]) : []
          } catch {
            return []
          }
        }),
      ]
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] h-[60vh] text-muted-foreground">
        Memuat peta...
      </div>
    )
  }

  return (
    <div className="relative min-h-[400px] h-[60vh] rounded-lg overflow-hidden border">
      {/* Instruction overlay */}
      {showInstruction && (
        <div
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-background/80 backdrop-blur rounded-full px-4 py-2 text-xs shadow border flex items-center gap-2 pointer-events-none animate-pulse"
        >
          <MapPin className="h-3.5 w-3.5 text-primary" />
          Klik peta untuk menambah titik baru
        </div>
      )}

      <MapContainer
        center={[-2.5, 117.5]}
        zoom={5}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBoundsOnData points={allPoints} />
        <ClickHandler onClick={handleMapClick} />

        {/* Router markers */}
        {data?.routers.map((r) =>
          hasCoords(r) ? (
            <Marker
              key={`router-${r.id}`}
              position={[parseFloat(String(r.latitude)), parseFloat(String(r.longitude))]}
              icon={iconRouter}
            >
              <Popup>
                <div className="text-sm space-y-1 min-w-[160px]">
                  <p className="font-bold">{r.name}</p>
                  <p>IP: {r.ip_address}</p>
                  <p>Status: {r.status}</p>
                  {r.notes && <p className="text-xs text-muted-foreground break-words">Catatan: {r.notes}</p>}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1"
                      onClick={() => handleMarkerEdit({ id: r.id, type: "router", name: r.name, currentNote: r.notes || "" })}
                    >
                      <Edit3 className="h-3 w-3" /> Edit Catatan
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}

        {/* ODC markers */}
        {data?.odcs.map((o) =>
          hasCoords(o) ? (
            <Marker
              key={`odc-${o.id}`}
              position={[parseFloat(String(o.latitude)), parseFloat(String(o.longitude))]}
              icon={iconOdc}
            >
              <Popup>
                <div className="text-sm space-y-1 min-w-[160px]">
                  <p className="font-bold">{o.name}</p>
                  <p>Kode: {o.code}</p>
                  <p>Kapasitas: {o.capacity} | Terpakai: {o.port_used}</p>
                  <p>Status: {o.status}</p>
                  {o.router_name && <p>Router: {o.router_name}</p>}
                  {o.address && <p className="text-xs text-muted-foreground break-words">Alamat: {o.address}</p>}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1"
                      onClick={() => handleMarkerEdit({ id: o.id, type: "odc", name: o.name, currentNote: o.address || "" })}
                    >
                      <Edit3 className="h-3 w-3" /> Edit Catatan
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}

        {/* ODP markers */}
        {data?.odps.map((p) =>
          hasCoords(p) ? (
            <Marker
              key={`odp-${p.id}`}
              position={[parseFloat(String(p.latitude)), parseFloat(String(p.longitude))]}
              icon={iconOdp}
            >
              <Popup>
                <div className="text-sm space-y-1 min-w-[160px]">
                  <p className="font-bold">{p.name}</p>
                  <p>Kode: {p.code}</p>
                  <p>Kapasitas: {p.capacity} | Terpakai: {p.port_used}</p>
                  <p>Status: {p.status}</p>
                  {p.odc_name && <p>ODC: {p.odc_name}</p>}
                  {p.address && <p className="text-xs text-muted-foreground break-words">Alamat: {p.address}</p>}
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1"
                      onClick={() => handleMarkerEdit({ id: p.id, type: "odp", name: p.name, currentNote: p.address || "" })}
                    >
                      <Edit3 className="h-3 w-3" /> Edit Catatan
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}

        {/* Cable route polylines */}
        {data?.cables.map((c) => {
          let coords: [number, number][] = []
          try {
            const raw: number[][] = typeof c.coordinates === "string" ? JSON.parse(c.coordinates) : c.coordinates
            if (Array.isArray(raw)) {
              coords = raw
                .filter((pt) => Array.isArray(pt) && pt.length >= 2)
                .map((pt) => [pt[0], pt[1]])
            }
          } catch {}
          if (coords.length < 2) return null
          return (
            <Polyline
              key={`cable-${c.id}`}
              positions={coords}
              pathOptions={{
                color: cableColor[c.type] || "#eab308",
                weight: 3,
                opacity: 0.7,
              }}
            >
              <Popup>
                <div className="text-sm space-y-1">
                  <p className="font-bold">{c.name}</p>
                  <p>Tipe: {c.type}</p>
                  <p>Jarak: {c.distance_km} km</p>
                  {c.odc_name && <p>ODC: {c.odc_name}</p>}
                  {c.odp_name && <p>ODP: {c.odp_name}</p>}
                </div>
              </Popup>
            </Polyline>
          )
        })}
      </MapContainer>

      {/* ── Add Marker Modal (Dialog on desktop, Sheet on mobile) ── */}
      {clickLatLng && !isMobile && (
        <Dialog open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) setClickLatLng(null) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Titik Baru</DialogTitle>
              <DialogDescription>
                Isi detail untuk titik di koordinat yang dipilih.
              </DialogDescription>
            </DialogHeader>
            <AddMarkerForm
              lat={clickLatLng.lat}
              lng={clickLatLng.lng}
              onSave={handleAddSave}
              onCancel={() => { setShowAddModal(false); setClickLatLng(null) }}
              saving={saving}
            />
          </DialogContent>
        </Dialog>
      )}

      {clickLatLng && isMobile && (
        <Sheet open={showAddModal} onOpenChange={(open) => { setShowAddModal(open); if (!open) setClickLatLng(null) }}>
          <SheetContent side="bottom" className="rounded-t-2xl pb-8">
            <SheetHeader>
              <SheetTitle>Tambah Titik Baru</SheetTitle>
              <SheetDescription>
                Isi detail untuk titik di koordinat yang dipilih.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4 pt-2">
              <AddMarkerForm
                lat={clickLatLng.lat}
                lng={clickLatLng.lng}
                onSave={handleAddSave}
                onCancel={() => { setShowAddModal(false); setClickLatLng(null) }}
                saving={saving}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Edit Note Dialog ── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Catatan</DialogTitle>
            <DialogDescription>
              Perbarui catatan atau alamat untuk titik ini.
            </DialogDescription>
          </DialogHeader>
          {editTarget && (
            <EditNoteForm
              target={editTarget}
              onSave={handleEditSave}
              onCancel={() => setEditTarget(null)}
              saving={editing}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-[1000] bg-background/90 backdrop-blur rounded-lg p-3 text-xs space-y-1.5 shadow border">
        <p className="font-semibold mb-1">Legenda</p>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Router
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> ODC
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> ODP
        </div>
        <hr className="my-1" />
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-red-500 inline-block" /> Feeder
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-yellow-500 inline-block" /> Distribution
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 bg-white inline-block" /> Drop
        </div>
      </div>
    </div>
  )
}
