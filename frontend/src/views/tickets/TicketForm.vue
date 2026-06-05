<template>
  <Dialog :visible="show" header="Tambah Tiket" :modal="true" class="w-full max-w-lg" @hide="$emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Pelanggan <span class="text-red-500">*</span></label>
        <Select
          v-model="form.customer_id"
          :options="customerOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Cari pelanggan..."
          class="w-full"
          filter
          :filterFields="['label']"
          :loading="customerLoading"
          required
        />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kategori <span class="text-red-500">*</span></label>
          <Select v-model="form.category" :options="categoryOptions" class="w-full" required />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Prioritas <span class="text-red-500">*</span></label>
          <Select v-model="form.priority" :options="priorityOptions" class="w-full" required />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Subjek <span class="text-red-500">*</span></label>
        <InputText v-model="form.subject" class="w-full" required />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
        <Textarea v-model="form.description" class="w-full" rows="4" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Ditugaskan ke</label>
        <InputText v-model="form.assigned_to" class="w-full" placeholder="Nama teknisi" />
      </div>
      <div class="flex justify-end gap-3">
        <Button label="Batal" severity="secondary" @click="$emit('close')" />
        <Button type="submit" :loading="saving" label="Simpan" severity="primary" />
      </div>
    </form>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '../../api/axios.js'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['close', 'saved'])
const toast = useToast()

const saving = ref(false)
const customerLoading = ref(false)
const customerOptions = ref([])

const form = ref({ customer_id: null, category: 'technical', priority: 'medium', subject: '', description: '', assigned_to: '' })

const categoryOptions = [
  { label: 'Technical', value: 'technical' },
  { label: 'Billing', value: 'billing' },
  { label: 'Installation', value: 'installation' },
  { label: 'Other', value: 'other' }
]
const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' }
]

watch(() => props.show, async (val) => {
  if (val) {
    form.value = { customer_id: null, category: 'technical', priority: 'medium', subject: '', description: '', assigned_to: '' }
    customerLoading.value = true
    try {
      const res = await api.get('/customers', { params: { per_page: 100 } }).catch(() => ({ data: [] }))
      const customers = Array.isArray(res.data) ? res.data : (res.data.data || [])
      customerOptions.value = customers.map(c => ({
        label: `${c.name} (${c.uid})`,
        value: c.id
      }))
    } catch (e) {
      customerOptions.value = []
    } finally {
      customerLoading.value = false
    }
  }
})

async function handleSubmit() {
  if (!form.value.customer_id) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Pilih pelanggan', life: 3000 })
    return
  }
  saving.value = true
  try {
    await api.post('/tickets', form.value)
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Tiket berhasil ditambahkan', life: 3000 })
    emit('saved')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menambah tiket', life: 3000 })
  } finally {
    saving.value = false
  }
}
</script>
