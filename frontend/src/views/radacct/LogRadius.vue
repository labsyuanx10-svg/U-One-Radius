<template>
  <div>
    <Toolbar class="mb-6">
      <template #start>
        <h2 class="text-xl font-bold text-gray-800">Log Radius</h2>
      </template>
      <template #end>
        <Button label="Refresh" icon="pi pi-refresh" severity="secondary" @click="loadData" />
      </template>
    </Toolbar>

    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select v-model="filterType" :options="typeOptions" placeholder="Semua" class="w-full" @change="page=1; loadData()" />
          </div>
          <div>
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText v-model="search" placeholder="Cari username/nama/UID..." class="w-full" @input="debouncedSearch" />
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
        <DataTable v-else :value="logs" stripedRows paginator :rows="perPage" :totalRecords="total" :lazy="true" :first="(page-1)*perPage" @page="onPage" class="p-datatable-sm text-sm">
          <Column field="customer_name" header="Nama"></Column>
          <Column field="customer_uid" header="UID"></Column>
          <Column field="username" header="Username"></Column>
          <Column header="Aksi">
            <template #body="{ data }">
              <Tag :value="data.action === 'connect' ? 'Konek' : data.action" :severity="data.action === 'connect' ? 'success' : (data.action === 'disconnect' ? 'warn' : 'danger')" />
            </template>
          </Column>
          <Column field="framedipaddress" header="IP"></Column>
          <Column field="callingstationid" header="MAC"></Column>
          <Column header="Waktu">
            <template #body="{ data }">
              <span v-if="data.action === 'connect'" class="text-green-600">{{ formatDate(data.acctstarttime) }}</span>
              <span v-else class="text-orange-600">{{ formatDate(data.acctstoptime || data.acctstarttime) }}</span>
            </template>
          </Column>
          <Column header="Durasi">
            <template #body="{ data }">{{ formatDuration(data.acctsessiontime) }}</template>
          </Column>
          <Column field="acctterminatecause" header="Alasan Putus"></Column>
          <template #empty>
            <div class="text-center py-12 text-gray-400">
              <i class="pi pi-history text-4xl block mb-2"></i>
              <span>Belum ada log radius</span>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api/axios.js'
import Toolbar from 'primevue/toolbar'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputIcon from 'primevue/inputicon'
import IconField from 'primevue/iconfield'
import Select from 'primevue/select'
import Tag from 'primevue/tag'

const search = ref('')
const filterType = ref(null)
const logs = ref([])
const loading = ref(true)
const page = ref(1)
const perPage = ref(25)
const total = ref(0)

const typeOptions = [
  { label: 'Semua', value: null },
  { label: 'Konek', value: 'connect' },
  { label: 'Putus', value: 'disconnect' }
]

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDuration(s) {
  if (!s || s === 0) return '-'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}j ${m}m`
  if (m > 0) return `${m}m ${sec}d`
  return `${sec}d`
}

let debounceTimer
function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; loadData() }, 300)
}

function onPage(event) {
  page.value = event.page + 1
  perPage.value = event.rows
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params = { page: page.value, per_page: perPage.value }
    if (search.value) params.search = search.value
    if (filterType.value) params.type = filterType.value
    const res = await api.get('/radacct/log', { params })
    const d = res.data
    logs.value = Array.isArray(d.data) ? d.data : []
    total.value = d.total || logs.value.length
  } catch (e) {
    logs.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })
</script>
