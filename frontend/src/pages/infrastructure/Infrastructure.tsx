import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InfrastructureMap } from "./InfrastructureMap"
import { OdcList } from "./OdcList"
import { OdpList } from "./OdpList"
import { CableRouteList } from "./CableRouteList"

export function Infrastructure() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Infrastruktur</h2>
        <p className="text-sm text-muted-foreground">Kelola ODC, ODP, dan rute kabel jaringan</p>
      </div>

      <Tabs defaultValue="peta">
        <TabsList>
          <TabsTrigger value="peta">Peta</TabsTrigger>
          <TabsTrigger value="odc">ODC</TabsTrigger>
          <TabsTrigger value="odp">ODP</TabsTrigger>
          <TabsTrigger value="kabel">Kabel</TabsTrigger>
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
