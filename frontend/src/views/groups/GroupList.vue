<template>
  <div>
    <Toolbar class="mb-6">
      <template #start>
        <h2 class="text-xl font-bold text-gray-800">Group</h2>
      </template>
      <template #end>
        <Button label="Tambah Group" icon="pi pi-plus" severity="primary" @click="openForm(null)" />
      </template>
    </Toolbar>

    <Card>
      <template #content>
        <div v-if="loading" class="flex items-center justify-center py-20">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
        </div>
        <DataTable v-else :value="groups" stripedRows paginator :rows="10" :rowsPerPageOptions="[10,25,50]" sortField="name" :sortOrder="1" class="p-datatable-sm">
          <Column field="code" header="Kode" sortable></Column>
          <Column field="name" header="Nama" sortable></Column>
          <Column field="address" header="Alamat"></Column>
          <Column field="phone" header="No Telp"></Column>
          <Column field="email" header="Email"></Column>
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag :value="data.status === 'active' ? 'Aktif' : 'Nonaktif'" :severity="data.status === 'active' ? 'success' : 'danger'" />
            </template>
          </Column>
          <Column header="Aksi" style="width:120px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button icon="pi pi-pencil" severity="warn" text rounded @click="openForm(data)" />
                <Button icon="pi pi-trash" severity="danger" text rounded @click="confirmDelete(data)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-12 text-gray-400">
              <i class="pi pi-folder-open text-4xl block mb-2"></i>
              <span>Belum ada group</span>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="showModal" :header="editing ? 'Edit Group' : 'Tambah Group'" :modal="true" class="w-full max-w-lg">
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kode</label>
            <InputText v-model="form.code" class="w-full" placeholder="GRP-001" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama <span class="text-red-500">*</span></label>
            <InputText v-model="form.name" class="w-full" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">No Telp</label>
            <InputText v-model="form.phone" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <InputText v-model="form.email" type="email" class="w-full" />
          </div>
          <div class="col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <Textarea v-model="form.address" class="w-full" rows="2" />
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
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Tag from 'primevue/tag'

const toast = useToast()
const confirm = useConfirm()

const groups = ref([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref(false)
const saving = ref(false)
const editId = ref(null)

const form = ref({ code: '', name: '', address: '', phone: '', email: '', active: true })

function openForm(group) {
  if (group) {
    editing.value = true
    editId.value = group.id
    form.value = {
      code: group.code || '',
      name: group.name || '',
      address: group.address || '',
      phone: group.phone || '',
      email: group.email || '',
      active: group.status === 'active'
    }
  } else {
    editing.value = false
    editId.value = null
    form.value = { code: '', name: '', address: '', phone: '', email: '', active: true }
  }
  showModal.value = true
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.get('/groups').catch(() => ({ data: [] }))
    groups.value = Array.isArray(res.data) ? res.data : (res.data.data || [])
  } catch (e) {}
  finally { loading.value = false }
}

async function handleSubmit() {
  saving.value = true
  try {
    const payload = { ...form.value, status: form.value.active ? 'active' : 'inactive' }
    delete payload.active
    if (editing.value) {
      await api.put(`/groups/${editId.value}`, payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Group berhasil diupdate', life: 3000 })
    } else {
      await api.post('/groups', payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Group berhasil ditambahkan', life: 3000 })
    }
    showModal.value = false
    loadData()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan group', life: 3000 })
  } finally {
    saving.value = false
  }
}

function confirmDelete(group) {
  confirm.require({
    message: `Yakin hapus group <strong>${group.name}</strong>?`,
    header: 'Hapus Group',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: 'Batal',
    acceptLabel: 'Hapus',
    accept: async () => {
      try {
        await api.delete(`/groups/${group.id}`)
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Group berhasil dihapus', life: 3000 })
        loadData()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus group', life: 3000 })
      }
    }
  })
}

onMounted(() => { loadData() })
</script>
