<template>
  <div>
    <Toolbar class="mb-4">
      <template #start>
        <span class="text-base font-semibold text-gray-800">Daftar Paket Internet</span>
      </template>
      <template #end>
        <Button label="Tambah Paket" icon="pi pi-plus" severity="primary" @click="openForm(null)" />
      </template>
    </Toolbar>

    <DataTable :value="plans" stripedRows paginator :rows="10" sortField="name" :sortOrder="1" class="p-datatable-sm">
      <Column field="name" header="Nama" sortable></Column>
      <Column field="type" header="Tipe" sortable></Column>
      <Column field="price" header="Harga" sortable>
        <template #body="{ data }">{{ formatCurrency(data.price) }}</template>
      </Column>
      <Column field="bandwidth" header="Bandwidth"></Column>
      <Column field="burst" header="Burst"></Column>
      <Column field="pool_name" header="IP Pool"></Column>
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
          <i class="pi pi-box text-4xl block mb-2"></i>
          <span>Belum ada paket</span>
        </div>
      </template>
    </DataTable>

    <Dialog v-model:visible="showModal" :header="editing ? 'Edit Paket' : 'Tambah Paket'" :modal="true" class="w-full max-w-lg">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama <span class="text-red-500">*</span></label>
            <InputText v-model="form.name" class="w-full" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipe</label>
            <Select v-model="form.type" :options="typeOptions" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Harga <span class="text-red-500">*</span></label>
            <InputNumber v-model="form.price" class="w-full" :min="0" :max="999999999" mode="currency" currency="IDR" locale="id-ID" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Bandwidth</label>
            <InputText v-model="form.bandwidth" class="w-full" placeholder="50M/50M" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Burst</label>
            <InputText v-model="form.burst" class="w-full" placeholder="100M/100M" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">IP Pool</label>
            <Select v-model="form.pool_id" :options="poolOptions" placeholder="Pilih Pool" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Group</label>
            <Select v-model="form.group_id" :options="groupOptions" placeholder="Global" class="w-full" />
          </div>
          <div class="flex items-center gap-3 pt-6">
            <ToggleSwitch v-model="form.active" />
            <span class="text-sm text-gray-700">Aktif</span>
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
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
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Tag from 'primevue/tag'

const toast = useToast()
const confirm = useConfirm()

const plans = ref([])
const pools = ref([])
const groups = ref([])
const showModal = ref(false)
const editing = ref(false)
const saving = ref(false)
const editId = ref(null)

const typeOptions = [
  { label: 'PPPoE', value: 'pppoe' },
  { label: 'Hotspot', value: 'hotspot' },
  { label: 'Static', value: 'static' }
]

const poolOptions = ref([])
const groupOptions = ref([])

const form = ref({ name: '', type: 'pppoe', price: 0, bandwidth: '', burst: '', pool_id: null, group_id: null, active: true })

function formatCurrency(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
}

function openForm(plan) {
  if (plan) {
    editing.value = true
    editId.value = plan.id
    form.value = {
      name: plan.name || '',
      type: plan.type || 'pppoe',
      price: plan.price || 0,
      bandwidth: plan.bandwidth || '',
      burst: plan.burst || '',
      pool_id: plan.pool_id || null,
      group_id: plan.group_id || null,
      active: plan.status === 'active'
    }
  } else {
    editing.value = false
    editId.value = null
    form.value = { name: '', type: 'pppoe', price: 0, bandwidth: '', burst: '', pool_id: null, group_id: null, active: true }
  }
  showModal.value = true
}

async function loadData() {
  try {
    const [pRes, poolRes, gRes] = await Promise.all([
      api.get('/plans').catch(() => ({ data: [] })),
      api.get('/pools').catch(() => ({ data: [] })),
      api.get('/groups').catch(() => ({ data: [] }))
    ])
    plans.value = Array.isArray(pRes.data) ? pRes.data : (pRes.data.data || [])
    pools.value = Array.isArray(poolRes.data) ? poolRes.data : (poolRes.data.data || [])
    groups.value = Array.isArray(gRes.data) ? gRes.data : (gRes.data.data || [])

    poolOptions.value = pools.value.map(p => ({ label: p.name, value: p.id }))
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
      price: Number(form.value.price),
      status: form.value.active ? 'active' : 'inactive'
    }
    delete payload.active
    if (editing.value) {
      await api.put(`/plans/${editId.value}`, payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Paket berhasil diupdate', life: 3000 })
    } else {
      await api.post('/plans', payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Paket berhasil ditambahkan', life: 3000 })
    }
    showModal.value = false
    loadData()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan paket', life: 3000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(plan) {
  confirm.require({
    message: `Yakin hapus paket <strong>${plan.name}</strong>?`,
    header: 'Hapus Paket',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: 'Hapus',
    accept: async () => {
      try {
        await api.delete(`/plans/${plan.id}`)
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Paket berhasil dihapus', life: 3000 })
        loadData()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus paket', life: 3000 })
      }
    }
  })
}

onMounted(() => { loadData() })
</script>
