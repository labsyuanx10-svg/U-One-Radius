import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Eye, Edit, Trash2, Download } from "lucide-react"

interface Customer {
  id: number
  uid: string
  name: string
  phone: string
  group_name: string
  plan_name: string
  status: string
  username_radius: string
}

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)

  const fetchCustomers = () => {
    setLoading(true)
    const params = `?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ""}`
    api.get(`/customers${params}`)
      .then((res) => {
        const d = res.data
        setCustomers(Array.isArray(d) ? d : d?.data || [])
        setTotal(d?.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCustomers()
  }, [page, search])

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus pelanggan ini?")) return
    try {
      await api.delete(`/customers/${id}`)
      fetchCustomers()
    } catch {}
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  const exportQuery = new URLSearchParams()
  const token = localStorage.getItem("token")
  if (token) exportQuery.set("token", token)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Pelanggan</h2>
          <p className="text-sm text-muted-foreground">Kelola data pelanggan ISP</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/api/customers/export?${exportQuery.toString()}`, "_blank")}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Link to="/customers/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pelanggan
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, UID, atau no HP..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
            <Badge variant="secondary" className="ml-auto">
              {total} pelanggan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>UID</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Tidak ada pelanggan
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs font-medium">{c.uid}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.group_name || "-"}</TableCell>
                    <TableCell>{c.plan_name || "-"}</TableCell>
                    <TableCell className="font-mono text-xs">{c.username_radius || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === "active"
                            ? "success"
                            : c.status === "expired"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/customers/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link to={`/customers/${c.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <p className="text-sm text-muted-foreground">
              Halaman {page} dari {totalPages} ({total} pelanggan)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Sebelumnya
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
