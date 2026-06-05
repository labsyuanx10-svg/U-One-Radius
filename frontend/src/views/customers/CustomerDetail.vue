<template>
  <div>
    <div v-if="loading" class="flex items-center justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
    </div>

    <template v-else-if="customer">
      <Toolbar class="mb-6">
        <template #start>
          <h2 class="text-xl font-bold text-gray-800">Detail Pelanggan</h2>
        </template>
        <template #end>
          <router-link :to="`/customers/${customer.id}/edit`">
            <Button label="Edit" icon="pi pi-pencil" severity="warn" class="mr-2" />
          </router-link>
          <Button label="Ganti Paket" icon="pi pi-swap" severity="primary" class="mr-2" @click="showPlanModal = true" />
          <Button label="Perpanjang" icon="pi pi-calendar-plus" severity="success" @click="showExtendModal = true" />
        </template>
      </Toolbar>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card class="lg:col-span-2">
          <template #content>
            <div class="flex items-start gap-4 mb-4">
              <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-2xl font-bold text-primary-700">
                {{ (customer.name || 'U').charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-800">{{ customer.name }}</h3>
                <p class="text-xs text-gray-400 font-mono">{{ customer.uid }}</p>
                <div class="mt-2">
                  <Tag :value="statusLabel(customer.status)" :severity="statusSeverity(customer.status)" />
                </div>
              </div>
            </div>
            <Divider />
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-gray-400">No HP</p>
                <p class="font-medium">{{ customer.phone || '-' }}</p>
              </div>
              <div>
                <p class="text-gray-400">Group</p>
                <p class="font-medium">{{ customer.group_name || '-' }}</p>
              </div>
              <div>
                <p class="text-gray-400">Paket</p>
                <p class="font-medium">{{ customer.plan_name || '-' }}</p>
              </div>
              <div>
                <p class="text-gray-400">Jatuh Tempo</p>
                <p class="font-medium">{{ customer.expired_at ? formatDate(customer.expired_at) : '-' }}</p>
              </div>
              <div class="col-span-2">
                <p class="text-gray-400">Alamat</p>
                <p class="font-medium">{{ customer.address || '-' }}</p>
              </div>
            </div>
          </template>
        </Card>
        <Card class="p-0 overflow-hidden">
          <div ref="mapContainer" class="h-64 w-full"></div>
        </Card>
      </div>

      <Card class="mb-6">
        <template #content>
          <Tabs v-model:value="activeTab">
            <TabList>
              <Tab value="info">Info</Tab>
              <Tab value="tagihan">Tagihan</Tab>
              <Tab value="tiket">Tiket</Tab>
              <Tab value="riwayat">Riwayat</Tab>
            </TabList>
            <TabPanels>
              <TabPanel value="info">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><p class="text-gray-400">UID</p><p class="font-mono">{{ customer.uid }}</p></div>
                  <div><p class="text-gray-400">Nama</p><p>{{ customer.name }}</p></div>
                  <div><p class="text-gray-400">No HP</p><p>{{ customer.phone || '-' }}</p></div>
                  <div><p class="text-gray-400">Email</p><p>{{ customer.email || '-' }}</p></div>
                  <div class="md:col-span-2"><p class="text-gray-400">Alamat</p><p>{{ customer.address || '-' }}</p></div>
                  <div><p class="text-gray-400">Group</p><p>{{ customer.group_name || '-' }}</p></div>
                  <div><p class="text-gray-400">Paket</p><p>{{ customer.plan_name || '-' }}</p></div>
                  <div><p class="text-gray-400">Status</p><Tag :value="statusLabel(customer.status)" :severity="statusSeverity(customer.status)" /></div>
                  <div><p class="text-gray-400">Tgl Aktivasi</p><p>{{ customer.activated_at ? formatDate(customer.activated_at) : '-' }}</p></div>
                  <div><p class="text-gray-400">Jatuh Tempo</p><p>{{ customer.expired_at ? formatDate(customer.expired_at) : '-' }}</p></div>
                  <div><p class="text-gray-400">Koordinat</p><p>{{ customer.lat && customer.lng ? `${customer.lat}, ${customer.lng}` : '-' }}</p></div>
                </div>
              </TabPanel>
              <TabPanel value="tagihan">
                <div v-if="transactions.length === 0" class="text-center py-8 text-gray-400 text-sm">Belum ada tagihan</div>
                <DataTable v-else :value="transactions" stripedRows class="p-datatable-sm">
                  <Column field="invoice_no" header="Invoice"></Column>
                  <Column field="amount" header="Jumlah">
                    <template #body="{ data }">
                      {{ formatCurrency(data.amount) }}
                    </template>
                  </Column>
                  <Column field="status" header="Status">
                    <template #body="{ data }">
                      <Tag :value="data.status === 'paid' ? 'Lunas' : 'Belum Bayar'" :severity="data.status === 'paid' ? 'success' : 'danger'" />
                    </template>
                  </Column>
                  <Column field="due_date" header="Jatuh Tempo">
                    <template #body="{ data }">{{ formatDate(data.due_date) }}</template>
                  </Column>
                  <Column field="paid_at" header="Dibayar">
                    <template #body="{ data }">{{ data.paid_at ? formatDate(data.paid_at) : '-' }}</template>
                  </Column>
                  <template #empty>
                    <div class="text-center py-8 text-gray-400">Belum ada tagihan</div>
                  </template>
                </DataTable>
              </TabPanel>
              <TabPanel value="tiket">
                <div v-if="tickets.length === 0" class="text-center py-8 text-gray-400 text-sm">Belum ada tiket</div>
                <div v-else class="space-y-3">
                  <div v-for="t in tickets" :key="t.id" class="p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                    <div class="flex items-start justify-between">
                      <div>
                        <p class="font-medium text-sm">{{ t.subject || 'Tiket' }}</p>
                        <p class="text-xs text-gray-400 mt-1">{{ t.category }} • {{ t.priority }}</p>
                      </div>
                      <Tag :value="statusLabelTiket(t.status)" :severity="severityTiket(t.status)" />
                    </div>
                    <p v-if="t.description" class="text-xs text-gray-500 mt-2">{{ t.description }}</p>
                  </div>
                </div>
              </TabPanel>
              <TabPanel value="riwayat">
                <div v-if="history.length === 0" class="text-center py-8 text-gray-400 text-sm">Belum ada riwayat</div>
                <div v-else class="space-y-3">
                  <div v-for="h in history" :key="h.id" class="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
                    <div class="w-2 h-2 mt-2 rounded-full flex-shrink-0" :class="h.type === 'subscription' ? 'bg-blue-500' : 'bg-gray-400'"></div>
                    <div class="flex-1">
                      <p class="text-sm">{{ h.description }}</p>
                      <p class="text-xs text-gray-400">{{ formatDate(h.created_at) }}</p>
                    </div>
                  </div>
                </div>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </template>
      </Card>
    </template>

    <div v-else class="text-center py-20 text-gray-400">
      <i class="pi pi-user text-4xl block mb-2"></i>
      <p>Pelanggan tidak ditemukan</p>
    </div>

    <Dialog v-model:visible="showPlanModal" header="Ganti Paket" :modal="true" class="w-full max-w-sm">
      <form @submit.prevent="changePlan" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Paket Baru</label>
          <Select v-model="newPlanId" :options="plans" optionLabel="name" optionValue="id" placeholder="Pilih Paket" class="w-full" required />
        </div>
        <div class="flex justify-end gap-3">
          <Button label="Batal" severity="secondary" @click="showPlanModal = false" />
          <Button type="submit" :loading="planLoading" label="Simpan" severity="primary" />
        </div>
      </form>
    </Dialog>

    <Dialog v-model:visible="showExtendModal" header="Perpanjang Langganan" :modal="true" class="w-full max-w-sm">
      <form @submit.prevent="extend" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Periode (bulan)</label>
          <Select v-model="extendMonths" :options="[1,3,6,12]" class="w-full" />
        </div>
        <div class="flex justify-end gap-3">
          <Button label="Batal" severity="secondary" @click="showExtendModal = false" />
          <Button type="submit" :loading="extendLoading" label="Perpanjang" severity="success" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import api from '../../api/axios.js'
import Toolbar from 'primevue/toolbar'
import Card from 'primevue/card'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import Divider from 'primevue/divider'
import Tag from 'primevue/tag'

const route = useRoute()
const toast = useToast()

const loading = ref(true)
const customer = ref(null)
const plans = ref([])
const transactions = ref([])
const tickets = ref([])
const history = ref([])
const activeTab = ref('info')
const showPlanModal = ref(false)
const showExtendModal = ref(false)
const newPlanId = ref(null)
const planLoading = ref(false)
const extendMonths = ref(1)
const extendLoading = ref(false)
const mapContainer = ref(null)
let mapInstance = null

function statusLabel(s) {
  const map = { active: 'Aktif', expired: 'Expired', isolir: 'Isolir', none: 'Belum Aktif' }
  return map[s] || s
}
function statusSeverity(s) {
  const map = { active: 'success', expired: 'danger', isolir: 'danger', none: 'info' }
  return map[s] || 'info'
}
function statusLabelTiket(s) {
  const map = { open: 'Open', closed: 'Closed', pending: 'Pending' }
  return map[s] || s
}
function severityTiket(s) {
  const map = { open: 'info', closed: 'secondary', pending: 'warn' }
  return map[s] || 'secondary'
}
function formatDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' }
function formatCurrency(v) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v) }

async function initMap() {
  await nextTick()
  if (!mapContainer.value || !customer.value?.lat || !customer.value?.lng) return
  const L = (await import('leaflet')).default
  if (mapInstance) { mapInstance.remove(); mapInstance = null }
  mapInstance = L.map(mapContainer.value).setView([customer.value.lat, customer.value.lng], 15)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapInstance)
  L.marker([customer.value.lat, customer.value.lng]).addTo(mapInstance)
    .bindPopup(`<b>${customer.value.name}</b>`)
}

async function loadData() {
  loading.value = true
  try {
    const id = route.params.id
    const [cRes, plansRes, txRes, ticketRes, histRes] = await Promise.all([
      api.get(`/customers/${id}`).catch(() => ({ data: null })),
      api.get('/plans').catch(() => ({ data: [] })),
      api.get(`/customers/${id}/transactions`).catch(() => ({ data: [] })),
      api.get(`/customers/${id}/tickets`).catch(() => ({ data: [] })),
      api.get(`/customers/${id}/history`).catch(() => ({ data: [] }))
    ])
    customer.value = cRes.data
    plans.value = Array.isArray(plansRes.data) ? plansRes.data : (plansRes.data.data || [])
    transactions.value = Array.isArray(txRes.data) ? txRes.data : (txRes.data.data || [])
    tickets.value = Array.isArray(ticketRes.data) ? ticketRes.data : (ticketRes.data.data || [])
    history.value = Array.isArray(histRes.data) ? histRes.data : (histRes.data.data || [])
  } catch (e) {
    customer.value = null
  } finally {
    loading.value = false
  }
}

watch(() => customer.value?.lat, () => { if (customer.value) initMap() })

async function changePlan() {
  if (!newPlanId.value) return
  planLoading.value = true
  try {
    await api.post(`/customers/${customer.value.id}/change-plan`, { plan_id: newPlanId.value })
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Paket berhasil diubah', life: 3000 })
    showPlanModal.value = false
    loadData()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mengubah paket', life: 3000 })
  } finally {
    planLoading.value = false
  }
}

async function extend() {
  extendLoading.value = true
  try {
    await api.post(`/customers/${customer.value.id}/extend`, { months: extendMonths.value })
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Langganan diperpanjang', life: 3000 })
    showExtendModal.value = false
    loadData()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memperpanjang', life: 3000 })
  } finally {
    extendLoading.value = false
  }
}

onMounted(() => { loadData() })
</script>
