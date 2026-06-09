import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import api from "@/lib/api"

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
  id: number; name: string; ip_address: string; latitude?: number; longitude?: number; status: string
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

export function InfrastructureMap() {
  const [data, setData] = useState<MapData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
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
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[600px] text-muted-foreground">
        Memuat peta...
      </div>
    )
  }

  // Collect all coordinate points to fit bounds
  const allPoints: [number, number][] = []
  if (data) {
    data.routers.forEach((r) => { if (hasCoords(r)) allPoints.push([parseFloat(String(r.latitude)), parseFloat(String(r.longitude))]) })
    data.odcs.forEach((o) => { if (hasCoords(o)) allPoints.push([parseFloat(String(o.latitude)), parseFloat(String(o.longitude))]) })
    data.odps.forEach((p) => { if (hasCoords(p)) allPoints.push([parseFloat(String(p.latitude)), parseFloat(String(p.longitude))]) })
    data.cables.forEach((c) => {
      try {
        const coords: number[][] = typeof c.coordinates === "string" ? JSON.parse(c.coordinates) : c.coordinates
        if (Array.isArray(coords)) coords.forEach((pt) => { if (Array.isArray(pt) && pt.length >= 2) allPoints.push([pt[0], pt[1]]) })
      } catch {}
    })
  }

  return (
    <div className="relative h-[600px] rounded-lg overflow-hidden border">
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

        {/* Router markers */}
        {data?.routers.map((r) =>
          hasCoords(r) ? (
            <Marker
              key={`router-${r.id}`}
              position={[parseFloat(String(r.latitude)), parseFloat(String(r.longitude))]}
              icon={iconRouter}
            >
              <Popup>
                <div className="text-sm space-y-1">
                  <p className="font-bold">{r.name}</p>
                  <p>IP: {r.ip_address}</p>
                  <p>Status: {r.status}</p>
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
                <div className="text-sm space-y-1">
                  <p className="font-bold">{o.name}</p>
                  <p>Kode: {o.code}</p>
                  <p>Kapasitas: {o.capacity} | Terpakai: {o.port_used}</p>
                  <p>Status: {o.status}</p>
                  {o.router_name && <p>Router: {o.router_name}</p>}
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
                <div className="text-sm space-y-1">
                  <p className="font-bold">{p.name}</p>
                  <p>Kode: {p.code}</p>
                  <p>Kapasitas: {p.capacity} | Terpakai: {p.port_used}</p>
                  <p>Status: {p.status}</p>
                  {p.odc_name && <p>ODC: {p.odc_name}</p>}
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
