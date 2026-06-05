<template>
  <div>
    <Toolbar class="mb-4">
      <template #start>
        <span class="text-base font-semibold text-gray-800">IP Pool</span>
      </template>
      <template #end>
        <Button label="Tambah Pool" icon="pi pi-plus" severity="primary" @click="openForm(null)" />
      </template>
    </Toolbar>

    <DataTable :value="pools" stripedRows paginator :rows="10" sortField="name" :sortOrder="1" class="p-datatable-sm">
      <Column field="name" header="Nama" sortable></Column>
      <Column field="range" header="Range IP"></Column>
      <Column field="gateway" header="Gateway"></Column>
      <Column field="dns" header="DNS"></Column>
      <Column field="router_name" header="Router"></Column>
      <Column field="group_name" header="Group">
        <template #body="{ data }">{{ data.group_name || 'Global' }}</template>
      </Column>
      <Column field="status" header="Status">
        <template #body="{ data }">
          <Tag :value="data.status === 'active' ? 'Aktif' : 'Nonaktif'" :severity="data.status === 'active' ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="Aksi" style="width:100px">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-pencil" severity="warn" text rounded @click="openForm(data)" />
            <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
          </div>
        </template>
      </Column>
      <template #empty>
        <div class="text-center py-12 text-gray-400">
          <i class="pi pi-sitemap text-4xl block mb-2"></i>
          <span>Belum ada IP pool</span>
        </div>
      </template>
    </DataTable>

    <Dialog v-model:visible="showModal" :header="editing ? 'Edit Pool' : 'Tambah Pool'" :modal="true" class="w-full max-w-lg">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama <span class="text-red-500">*</span></label>
            <InputText v-model="form.name" class="w-full" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Range IP</label>
            <InputText v-model="form.range" class="w-full" placeholder="192.168.1.2-192.168.1.254" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Gateway</label>
            <InputText v-model="form.gateway" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">DNS</label>
            <InputText v-model="form.dns" class="w-full" placeholder="8.8.8.8" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Router</label>
            <Select v-model="form.router_id" :options="routerOptions" placeholder="Pilih Router" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Group</label>
            <Select v-model="form.group_id" :options="groupOptions" placeholder="Global" class="w-full" />
          </div>
        </div>
        <div class="flex items-center gap-3">
          <ToggleSwitch v-model="form.active" />
          <span class="text-sm text-gray-700">Aktif</span>
        </div>
        <div class="flex justify-end gap-3">
          <Button label="Batal" severity="secondary" @click="showModal = false" />
          <Button type="submit" :loading="saving" label="Simpan" severity="primary" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '../../api/axios.js'
import Toolbar from 'primevue/toolbar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Tag from 'primevue/tag'

const toast = useToast()
const confirm = useConfirm()

const pools = ref([])
const routers = ref([])
const groups = ref([])
const showModal = ref(false)
const editing = ref(false)
const saving = ref(false)
const editId = ref(null)

const routerOptions = ref([])
const groupOptions = ref([])

const form = ref({ name: '', range: '', gateway: '', dns: '', router_id: null, group_id: null, active: true })

function openForm(pool) {
  if (pool) {
    editing.value = true
    editId.value = pool.id
    form.value = {
      name: pool.name || '',
      range: pool.range || '',
      gateway: pool.gateway || '',
      dns: pool.dns || '',
      router_id: pool.router_id || null,
      group_id: pool.group_id || null,
      active: pool.status === 'active'
    }
  } else {
    editing.value = false
    editId.value = null
    form.value = { name: '', range: '', gateway: '', dns: '', router_id: null, group_id: null, active: true }
  }
  showModal.value = true
}

async function loadData() {
  try {
    const [poolRes, rRes, gRes] = await Promise.all([
      api.get('/pools').catch(() => ({ data: [] })),
      api.get('/routers').catch(() => ({ data: [] })),
      api.get('/groups').catch(() => ({ data: [] }))
    ])
    pools.value = Array.isArray(poolRes.data) ? poolRes.data : (poolRes.data.data || [])
    routers.value = Array.isArray(rRes.data) ? rRes.data : (rRes.data.data || [])
    groups.value = Array.isArray(gRes.data) ? gRes.data : (gRes.data.data || [])

    routerOptions.value = routers.value.map(r => ({ label: r.name, value: r.id }))
    groupOptions.value = [
      { label: 'Global', value: null },
      ...groups.value.map(g => ({ label: g.name, value: g.id }))
    ]
  } catch (e) {}
}

async function handleSubmit() {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      status: form.value.active ? 'active' : 'inactive'
    }
    delete payload.active
    if (editing.value) {
      await api.put(`/pools/${editId.value}`, payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pool berhasil diupdate', life: 3000 })
    } else {
      await api.post('/pools', payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pool berhasil ditambahkan', life: 3000 })
    }
    showModal.value = false
    loadData()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan pool', life: 3000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(pool) {
  confirm.require({
    message: `Yakin hapus pool <strong>${pool.name}</strong>?`,
    header: 'Hapus Pool',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: 'Hapus',
    accept: async () => {
      try {
        await api.delete(`/pools/${pool.id}`)
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pool berhasil dihapus', life: 3000 })
        loadData()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus pool', life: 3000 })
      }
    }
  })
}

onMounted(() => { loadData() })
</script>
