<template>
  <div>
    <Toolbar class="mb-6">
      <template #start>
        <h2 class="text-xl font-bold text-gray-800">Router</h2>
      </template>
      <template #end>
        <Button label="Tambah Router" icon="pi pi-plus" severity="primary" @click="openForm(null)" />
      </template>
    </Toolbar>

    <Card>
      <template #content>
        <div v-if="loading" class="flex items-center justify-center py-20">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
        </div>
        <DataTable v-else :value="routers" stripedRows paginator :rows="10" sortField="name" :sortOrder="1" class="p-datatable-sm">
          <Column field="name" header="Nama" sortable></Column>
          <Column field="ip_address" header="IP Address"></Column>
          <Column field="type" header="Tipe"></Column>
          <Column field="group_name" header="Group">
            <template #body="{ data }">{{ data.group_name || '-' }}</template>
          </Column>
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag :value="data.status === 'active' ? 'Online' : 'Offline'" :severity="data.status === 'active' ? 'success' : 'danger'" />
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
              <i class="pi pi-server text-4xl block mb-2"></i>
              <span>Belum ada router</span>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="showModal" :header="editing ? 'Edit Router' : 'Tambah Router'" :modal="true" class="w-full max-w-lg">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama <span class="text-red-500">*</span></label>
            <InputText v-model="form.name" class="w-full" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">IP Address <span class="text-red-500">*</span></label>
            <InputText v-model="form.ip_address" class="w-full" required placeholder="192.168.1.1" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Port API</label>
            <InputNumber v-model="form.port" class="w-full" :min="1" :max="65535" placeholder="8728" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Secret</label>
            <Password v-model="form.secret" class="w-full" :feedback="false" placeholder="API password" toggleMask>
              <template #header>
                <span class="text-xs text-gray-400">Biarkan kosong jika tidak diubah</span>
              </template>
            </Password>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <Select v-model="form.type" :options="typeOptions" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Group</label>
            <Select v-model="form.group_id" :options="groupOptions" placeholder="Pilih Group" class="w-full" />
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
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Password from 'primevue/password'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Tag from 'primevue/tag'

const toast = useToast()
const confirm = useConfirm()

const routers = ref([])
const groups = ref([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref(false)
const saving = ref(false)
const editId = ref(null)

const typeOptions = [
  { label: 'Mikrotik', value: 'mikrotik' },
  { label: 'RouterOS', value: 'routeros' }
]
const groupOptions = ref([])

const form = ref({ name: '', ip_address: '', port: 8728, secret: '', type: 'mikrotik', group_id: null, active: true })

function openForm(router) {
  if (router) {
    editing.value = true
    editId.value = router.id
    form.value = {
      name: router.name || '',
      ip_address: router.ip_address || '',
      port: router.port || 8728,
      secret: '',
      type: router.type || 'mikrotik',
      group_id: router.group_id || null,
      active: router.status === 'active'
    }
  } else {
    editing.value = false
    editId.value = null
    form.value = { name: '', ip_address: '', port: 8728, secret: '', type: 'mikrotik', group_id: null, active: true }
  }
  showModal.value = true
}

async function loadData() {
  loading.value = true
  try {
    const [rRes, gRes] = await Promise.all([
      api.get('/routers').catch(() => ({ data: [] })),
      api.get('/groups').catch(() => ({ data: [] }))
    ])
    routers.value = Array.isArray(rRes.data) ? rRes.data : (rRes.data.data || [])
    groups.value = Array.isArray(gRes.data) ? gRes.data : (gRes.data.data || [])
    groupOptions.value = [
      { label: 'Pilih Group', value: null },
      ...groups.value.map(g => ({ label: g.name, value: g.id }))
    ]
  } catch (e) {}
  finally { loading.value = false }
}

async function handleSubmit() {
  saving.value = true
  try {
    const payload = {
      ...form.value,
      status: form.value.active ? 'active' : 'inactive'
    }
    delete payload.active
    if (!payload.secret) delete payload.secret
    if (editing.value) {
      await api.put(`/routers/${editId.value}`, payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Router berhasil diupdate', life: 3000 })
    } else {
      await api.post('/routers', payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Router berhasil ditambahkan', life: 3000 })
    }
    showModal.value = false
    loadData()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan router', life: 3000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(router) {
  confirm.require({
    message: `Yakin hapus router <strong>${router.name}</strong>?`,
    header: 'Hapus Router',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: 'Hapus',
    accept: async () => {
      try {
        await api.delete(`/routers/${router.id}`)
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Router berhasil dihapus', life: 3000 })
        loadData()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus router', life: 3000 })
      }
    }
  })
}

onMounted(() => { loadData() })
</script>
