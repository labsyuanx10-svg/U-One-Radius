<template>
  <div>
    <Toolbar class="mb-6">
      <template #start>
        <h2 class="text-xl font-bold text-gray-800">Status Online</h2>
        <Tag :value="`${stats.online} Online`" severity="success" class="ml-3" />
        <Tag :value="`${stats.active} Aktif`" severity="info" class="ml-2" />
      </template>
      <template #end>
        <Button label="Refresh" icon="pi pi-refresh" severity="secondary" @click="loadData" />
      </template>
    </Toolbar>

    <Card class="mb-6">
      <template #content>
        <IconField>
          <InputIcon class="pi pi-search" />
          <InputText v-model="search" placeholder="Cari username/nama/UID..." class="w-full" @input="debouncedSearch" />
        </IconField>
      </template>
    </Card>

    <Card>
      <template #content>
        <div v-if="loading" class="flex items-center justify-center py-20">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
        </div>
        <DataTable v-else :value="sessions" stripedRows paginator :rows="perPage" :totalRecords="total" :lazy="true" :first="(page-1)*perPage" @page="onPage" class="p-datatable-sm text-sm">
          <Column field="username" header="Username PPPoE"></Column>
          <Column field="customer_uid" header="UID"></Column>
          <Column field="customer_name" header="Nama"></Column>
          <Column field="customer_phone" header="No HP"></Column>
          <Column field="framedipaddress" header="IP Address"></Column>
          <Column field="callingstationid" header="MAC Address"></Column>
          <Column field="plan_name" header="Paket"></Column>
          <Column field="acctstarttime" header="Mulai">
            <template #body="{ data }">{{ formatDate(data.acctstarttime) }}</template>
          </Column>
          <Column field="acctsessiontime" header="Durasi">
            <template #body="{ data }">{{ formatDuration(data.acctsessiontime) }}</template>
          </Column>
          <template #empty>
            <div class="text-center py-12 text-gray-400">
              <i class="pi pi-users text-4xl block mb-2"></i>
              <span>Tidak ada user online</span>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../api/axios.js'
import Toolbar from 'primevue/toolbar'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputIcon from 'primevue/inputicon'
import IconField from 'primevue/iconfield'
import Tag from 'primevue/tag'

const search = ref('')
const sessions = ref([])
const loading = ref(true)
const page = ref(1)
const perPage = ref(25)
const total = ref(0)

const stats = computed(() => {
  const online = sessions.value.length
  return { online, active: online }
})

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
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
    const res = await api.get('/radacct/online', { params })
    const d = res.data
    sessions.value = Array.isArray(d.data) ? d.data : []
    total.value = d.total || sessions.value.length
  } catch (e) {
    sessions.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })
</script>
