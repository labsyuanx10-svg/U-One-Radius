import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InfrastructureMap } from "./InfrastructureMap"
import { OdcList } from "./OdcList"
import { OdpList } from "./OdpList"
import { CableRouteList } from "./CableRouteList"
import { MapPin, Layers, Cable, Globe, ChevronRight, Lightbulb } from "lucide-react"

export function Infrastructure() {
  const [showGuide, setShowGuide] = useState(true)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Infrastruktur</h2>
          <p className="text-sm text-muted-foreground">Kelola ODC, ODP, dan rute kabel jaringan</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowGuide(!showGuide)} className="text-xs gap-1">
          <Lightbulb className="h-3.5 w-3.5" />
          {showGuide ? "Sembunyikan" : "Panduan"}
        </Button>
      </div>

      {/* Guide card */}
      {showGuide && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-3 text-sm">
                <p className="font-medium text-foreground">Panduan Singkat Infrastruktur</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2 bg-card/50 rounded-lg p-3">
                    <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-xs">1. Router</p>
                      <p className="text-xs text-muted-foreground">Titik pusat jaringan. Sebelum ODC, pastikan router sudah terdaftar.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-card/50 rounded-lg p-3">
                    <Layers className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-xs">2. ODC</p>
                      <p className="text-xs text-muted-foreground">Kabinet distribusi. Terkait dengan router. Isi titik koordinat (klik peta).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-card/50 rounded-lg p-3">
                    <Globe className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-xs">3. ODP</p>
                      <p className="text-xs text-muted-foreground">Titik terminasi pelanggan. Terkait dengan ODC yang sudah ada.</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  <ChevronRight className="h-3 w-3 inline" /> Tips: Buka tab <strong>Peta</strong> dulu untuk lihat visualisasi, geser marker, atau klik di peta untuk isi koordinot.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="peta">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
          <TabsTrigger value="peta" className="text-xs sm:text-sm gap-1">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Peta</span>
          </TabsTrigger>
          <TabsTrigger value="odc" className="text-xs sm:text-sm gap-1">
            <Layers className="h-4 w-4" />
            <span>ODC</span>
          </TabsTrigger>
          <TabsTrigger value="odp" className="text-xs sm:text-sm gap-1">
            <MapPin className="h-4 w-4" />
            <span>ODP</span>
          </TabsTrigger>
          <TabsTrigger value="kabel" className="text-xs sm:text-sm gap-1">
            <Cable className="h-4 w-4" />
            <span>Kabel</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="peta" className="mt-4">
          <InfrastructureMap />
        </TabsContent>
        <TabsContent value="odc" className="mt-4">
          <OdcList />
        </TabsContent>
        <TabsContent value="odp" className="mt-4">
          <OdpList />
        </TabsContent>
        <TabsContent value="kabel" className="mt-4">
          <CableRouteList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
