<template>
  <div>
    <Toolbar class="mb-6">
      <template #start>
        <h2 class="text-xl font-bold text-gray-800">Pelanggan</h2>
      </template>
      <template #end>
        <router-link to="/customers/new">
          <Button label="Tambah Pelanggan" icon="pi pi-plus" severity="primary" />
        </router-link>
      </template>
    </Toolbar>

    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText v-model="search" placeholder="Cari nama/UID/HP..." class="w-full" @input="debouncedSearch" />
            </IconField>
          </div>
          <div>
            <Select v-model="filterGroup" :options="groupOptions" optionLabel="label" optionValue="value" placeholder="Semua Group" class="w-full" @change="page=1; loadData()" />
          </div>
          <div>
            <Select v-model="filterStatus" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Semua Status" class="w-full" @change="page=1; loadData()" />
          </div>
          <div>
            <Select v-model="perPage" :options="[10,25,50]" class="w-full" @change="page=1; loadData()" />
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <div v-if="loading" class="flex items-center justify-center py-20">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
        </div>
        <DataTable v-else :value="customers" stripedRows paginator :rows="perPage" :totalRecords="total" :lazy="true" :first="(page-1)*perPage" @page="onPage" sortField="name" :sortOrder="1" class="p-datatable-sm">
          <Column field="uid" header="UID" sortable></Column>
          <Column field="name" header="Nama" sortable></Column>
          <Column field="phone" header="No HP"></Column>
          <Column field="group_name" header="Group"></Column>
          <Column field="plan_name" header="Paket"></Column>
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag :value="statusLabel(data.status)" :severity="statusSeverity(data.status)" />
            </template>
          </Column>
          <Column field="expired_at" header="Jatuh Tempo">
            <template #body="{ data }">
              <span class="text-xs">{{ data.expired_at ? formatDate(data.expired_at) : '-' }}</span>
            </template>
          </Column>
          <Column header="Aksi" style="width:140px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <router-link :to="`/customers/${data.id}`">
                  <Button icon="pi pi-eye" text rounded severity="info" />
                </router-link>
                <router-link :to="`/customers/${data.id}/edit`">
                  <Button icon="pi pi-pencil" text rounded severity="warn" />
                </router-link>
                <Button icon="pi pi-trash" text rounded severity="danger" @click="confirmDelete(data)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-12 text-gray-400">
              <i class="pi pi-users text-4xl block mb-2"></i>
              <span>Belum ada pelanggan</span>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
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

const toast = useToast()
const confirm = useConfirm()

const search = ref('')
const filterGroup = ref(null)
const filterStatus = ref(null)
const perPage = ref(10)
const page = ref(1)
const total = ref(0)
const customers = ref([])
const groups = ref([])
const loading = ref(true)

const groupOptions = ref([])
const statusOptions = [
  { label: 'Aktif', value: 'active' },
  { label: 'Expired', value: 'expired' },
  { label: 'Isolir', value: 'isolir' },
  { label: 'Belum Aktif', value: 'none' }
].map(o => ({ label: o.label, value: o.value }))
statusOptions.unshift({ label: 'Semua Status', value: null })

function statusLabel(s) {
  const map = { active: 'Aktif', expired: 'Expired', isolir: 'Isolir', none: 'Belum Aktif' }
  return map[s] || s
}
function statusSeverity(s) {
  const map = { active: 'success', expired: 'danger', isolir: 'danger', none: 'info' }
  return map[s] || 'info'
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
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
    if (filterGroup.value) params.group_id = filterGroup.value
    if (filterStatus.value) params.status = filterStatus.value

    const [custRes, groupRes] = await Promise.all([
      api.get('/customers', { params }).catch(() => ({ data: { data: [], total: 0 } })),
      api.get('/groups').catch(() => ({ data: [] }))
    ])
    const data = custRes.data
    customers.value = Array.isArray(data) ? data : (data.data || [])
    total.value = data.total || customers.value.length
    groups.value = Array.isArray(groupRes.data) ? groupRes.data : (groupRes.data.data || [])
    groupOptions.value = [
      { label: 'Semua Group', value: null },
      ...groups.value.map(g => ({ label: g.name, value: g.id }))
    ]
  } catch (e) {
    customers.value = []
  } finally {
    loading.value = false
  }
}

function confirmDelete(c) {
  confirm.require({
    message: `Yakin hapus pelanggan <strong>${c.name}</strong>? Data tidak bisa dikembalikan.`,
    header: 'Hapus Pelanggan',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: 'Hapus',
    accept: async () => {
      try {
        await api.delete(`/customers/${c.id}`)
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pelanggan berhasil dihapus', life: 3000 })
        loadData()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus pelanggan', life: 3000 })
      }
    }
  })
}

onMounted(() => { loadData() })
</script>
