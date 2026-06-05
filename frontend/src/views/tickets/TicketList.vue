<template>
  <div>
    <Toolbar class="mb-6">
      <template #start>
        <h2 class="text-xl font-bold text-gray-800">Tiket</h2>
      </template>
      <template #end>
        <Button label="Tambah Tiket" icon="pi pi-plus" severity="primary" @click="showForm = true" />
      </template>
    </Toolbar>

    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Select v-model="filterStatus" :options="statusFilterOptions" placeholder="Semua Status" class="w-full" @change="loadData" />
          </div>
          <div>
            <Select v-model="filterCategory" :options="categoryFilterOptions" placeholder="Semua Kategori" class="w-full" @change="loadData" />
          </div>
          <div>
            <Select v-model="filterPriority" :options="priorityFilterOptions" placeholder="Semua Prioritas" class="w-full" @change="loadData" />
          </div>
          <div>
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText v-model="search" placeholder="Cari tiket..." class="w-full" @input="debouncedSearch" />
            </IconField>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <div v-if="loading" class="flex items-center justify-center py-20">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
        </div>
        <DataTable v-else :value="tickets" stripedRows paginator :rows="10" sortField="id" :sortOrder="-1" class="p-datatable-sm">
          <Column field="ticket_no" header="#">
            <template #body="{ data }">{{ data.ticket_no || data.id }}</template>
          </Column>
          <Column field="customer_name" header="Pelanggan"></Column>
          <Column field="subject" header="Subjek">
            <template #body="{ data }">
              <span class="max-w-[200px] inline-block truncate">{{ data.subject || '-' }}</span>
            </template>
          </Column>
          <Column field="category" header="Kategori"></Column>
          <Column field="priority" header="Prioritas">
            <template #body="{ data }">
              <Tag :value="priorityLabel(data.priority)" :severity="prioritySeverity(data.priority)" />
            </template>
          </Column>
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
            </template>
          </Column>
          <Column field="assigned_to_name" header="Ditugaskan">
            <template #body="{ data }">{{ data.assigned_to_name || '-' }}</template>
          </Column>
          <Column header="Aksi" style="width:80px">
            <template #body="{ data }">
              <Button label="Detail" severity="info" text @click="viewDetail(data)" />
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-12 text-gray-400">
              <i class="pi pi-ticket text-4xl block mb-2"></i>
              <span>Belum ada tiket</span>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <TicketForm :show="showForm" @close="showForm = false" @saved="onSaved" />

    <Dialog v-model:visible="showDetail" header="Detail Tiket" :modal="true" class="w-full max-w-lg">
      <div v-if="detail" class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-400 font-mono">{{ detail.ticket_no || '#'+detail.id }}</span>
          <Tag :value="statusLabel(detail.status)" :severity="statusSeverity(detail.status)" />
        </div>
        <div>
          <p class="text-xs text-gray-400">Pelanggan</p>
          <p class="font-medium">{{ detail.customer_name || '-' }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400">Subjek</p>
          <p class="font-medium">{{ detail.subject }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400">Deskripsi</p>
          <p class="text-sm text-gray-600 whitespace-pre-wrap">{{ detail.description }}</p>
        </div>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><p class="text-xs text-gray-400">Kategori</p><p>{{ detail.category }}</p></div>
          <div><p class="text-xs text-gray-400">Prioritas</p><Tag :value="priorityLabel(detail.priority)" :severity="prioritySeverity(detail.priority)" /></div>
          <div><p class="text-xs text-gray-400">Ditugaskan</p><p>{{ detail.assigned_to_name || '-' }}</p></div>
          <div><p class="text-xs text-gray-400">Tgl Dibuat</p><p>{{ formatDate(detail.created_at) }}</p></div>
        </div>
        <div class="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
          <Select v-model="newStatus" :options="statusUpdateOptions" class="w-40" />
          <Button label="Update Status" severity="primary" :loading="statusUpdating" @click="updateStatus" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '../../api/axios.js'
import Toolbar from 'primevue/toolbar'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputIcon from 'primevue/inputicon'
import IconField from 'primevue/iconfield'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import TicketForm from './TicketForm.vue'

const toast = useToast()

const tickets = ref([])
const loading = ref(true)
const showForm = ref(false)
const showDetail = ref(false)
const detail = ref(null)
const newStatus = ref('open')
const statusUpdating = ref(false)

const filterStatus = ref(null)
const filterCategory = ref(null)
const filterPriority = ref(null)
const search = ref('')

const statusFilterOptions = [
  { label: 'Semua Status', value: null },
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'Closed', value: 'closed' }
]
const categoryFilterOptions = [
  { label: 'Semua Kategori', value: null },
  { label: 'Technical', value: 'technical' },
  { label: 'Billing', value: 'billing' },
  { label: 'Installation', value: 'installation' },
  { label: 'Other', value: 'other' }
]
const priorityFilterOptions = [
  { label: 'Semua Prioritas', value: null },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' }
]
const statusUpdateOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'Closed', value: 'closed' }
]

function priorityLabel(p) {
  const map = { urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low' }
  return map[p] || p
}
function prioritySeverity(p) {
  const map = { urgent: 'danger', high: 'warn', medium: 'info', low: 'secondary' }
  return map[p] || 'secondary'
}
function statusLabel(s) {
  const map = { open: 'Open', pending: 'Pending', closed: 'Closed' }
  return map[s] || s
}
function statusSeverity(s) {
  const map = { open: 'info', pending: 'warn', closed: 'secondary' }
  return map[s] || 'secondary'
}
function formatDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' }

let debounceTimer
function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadData(), 300)
}

async function loadData() {
  loading.value = true
  try {
    const params = {}
    if (filterStatus.value) params.status = filterStatus.value
    if (filterCategory.value) params.category = filterCategory.value
    if (filterPriority.value) params.priority = filterPriority.value
    if (search.value) params.search = search.value
    const res = await api.get('/tickets', { params }).catch(() => ({ data: [] }))
    tickets.value = Array.isArray(res.data) ? res.data : (res.data.data || [])
  } catch (e) { tickets.value = [] }
  finally { loading.value = false }
}

function viewDetail(t) {
  detail.value = t
  newStatus.value = t.status
  showDetail.value = true
}

async function updateStatus() {
  if (!detail.value || newStatus.value === detail.value.status) return
  statusUpdating.value = true
  try {
    await api.put(`/tickets/${detail.value.id}`, { status: newStatus.value })
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Status tiket diupdate', life: 3000 })
    showDetail.value = false
    loadData()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal update status', life: 3000 })
  } finally {
    statusUpdating.value = false
  }
}

function onSaved() {
  showForm.value = false
  loadData()
}

onMounted(() => { loadData() })
</script>
