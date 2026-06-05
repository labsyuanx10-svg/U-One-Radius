<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-6">
      {{ isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru' }}
    </h2>

    <form @submit.prevent="handleSubmit" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card class="lg:col-span-2">
        <template #content>
          <!-- Data Pribadi -->
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Data Pribadi</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span class="text-red-500">*</span></label>
              <InputText v-model="form.name" class="w-full" required placeholder="Nama pelanggan" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">No HP</label>
              <InputText v-model="form.phone" class="w-full" placeholder="08xxx" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <InputText v-model="form.email" class="w-full" type="email" placeholder="email@example.com" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">No KTP/NIK</label>
              <InputText v-model="form.nik" class="w-full" placeholder="NIK" />
            </div>
          </div>

          <Divider class="my-4" />

          <!-- Alamat -->
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Alamat</h3>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
            <Textarea v-model="form.address" class="w-full" rows="2" placeholder="Jalan, RT/RW, Desa, Kecamatan, Kota" />
          </div>

          <Divider class="my-4" />

          <!-- Data Layanan -->
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Data Layanan</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Group <span class="text-red-500">*</span></label>
              <Select v-model="form.group_id" :options="groups" optionLabel="name" optionValue="id" placeholder="Pilih Group" class="w-full" required @change="onGroupChange" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Paket</label>
              <Select v-model="form.plan_id" :options="filteredPlans" optionLabel="label" optionValue="value" placeholder="Pilih Paket" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Username PPPoE / Login</label>
              <InputText v-model="form.username_radius" class="w-full" placeholder="pppoe username" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password PPPoE</label>
              <InputText v-model="form.password_radius" class="w-full" placeholder="auto-generate kalo kosong" />
            </div>
          </div>

          <!-- Aktivasi & Tagihan -->
          <div v-if="form.plan_id" class="mt-4 space-y-3">
            <div class="flex items-center gap-3">
              <ToggleSwitch v-model="form.activate_now" />
              <label class="text-sm font-medium text-gray-700">Aktifkan sekarang</label>
            </div>
            <div v-if="form.activate_now" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Aktivasi</label>
                <DatePicker v-model="form.started_at" class="w-full" dateFormat="dd/mm/yy" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Expired</label>
                <DatePicker v-model="form.expired_at" class="w-full" dateFormat="dd/mm/yy" />
              </div>
            </div>
          </div>

          <Divider class="my-4" />

          <!-- Data Teknis -->
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Perangkat</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Merk Perangkat / ONT</label>
              <InputText v-model="form.device_merk" class="w-full" placeholder="e.g. Huawei, FiberHome" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <InputText v-model="form.device_serial" class="w-full" placeholder="Serial ONT" />
            </div>
          </div>

          <Divider class="mt-6" />
          <div class="flex justify-end gap-3">
            <router-link to="/customers">
              <Button label="Batal" severity="secondary" />
            </router-link>
            <Button type="submit" :loading="saving" label="Simpan" severity="primary" />
          </div>
        </template>
      </Card>

      <Card class="p-0 overflow-hidden">
        <div class="p-4 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-700">Lokasi</h3>
          <p class="text-xs text-gray-400 mt-1">Klik peta untuk set koordinat</p>
        </div>
        <div ref="mapContainer" class="h-80 w-full"></div>
        <div class="p-3 border-t border-gray-100 flex gap-3 text-xs text-gray-500">
          <span>Lat: {{ form.lat || '-' }}</span>
          <span>Lng: {{ form.lng || '-' }}</span>
        </div>
      </Card>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import api from '../../api/axios.js'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Divider from 'primevue/divider'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const groups = ref([])
const plans = ref([])
const mapContainer = ref(null)
let mapInstance = null
let marker = null

const form = ref({
  name: '',
  phone: '',
  email: '',
  nik: '',
  address: '',
  group_id: null,
  plan_id: null,
  username_radius: '',
  password_radius: '',
  activate_now: false,
  started_at: new Date(),
  expired_at: null,
  device_merk: '',
  device_serial: '',
  lat: null,
  lng: null
})

const filteredPlans = computed(() => {
  let list = plans.value
  if (form.value.group_id) {
    list = list.filter(p => !p.group_id || p.group_id === form.value.group_id)
  }
  return list.map(p => ({
    label: `${p.name} - ${formatCurrency(p.price)}`,
    value: p.id
  }))
})

function formatCurrency(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
}

function onGroupChange() {
  if (!form.value.group_id) form.value.plan_id = null
}

async function initMap() {
  await nextTick()
  if (!mapContainer.value) return
  const L = (await import('leaflet')).default
  if (mapInstance) { mapInstance.remove(); mapInstance = null }
  const lat = form.value.lat || -6.2088
  const lng = form.value.lng || 106.8456
  mapInstance = L.map(mapContainer.value).setView([lat, lng], 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapInstance)
  if (form.value.lat && form.value.lng) {
    marker = L.marker([form.value.lat, form.value.lng]).addTo(mapInstance)
  }
  mapInstance.on('click', (e) => {
    form.value.lat = e.latlng.lat
    form.value.lng = e.latlng.lng
    if (marker) mapInstance.removeLayer(marker)
    marker = L.marker(e.latlng).addTo(mapInstance)
  })
}

async function loadEditData() {
  if (!isEdit.value) return
  try {
    const res = await api.get(`/customers/${route.params.id}`)
    const c = res.data
    form.value = {
      name: c.fullname || '',
      phone: c.phone || '',
      email: c.email || '',
      nik: c.nik || '',
      address: c.address || '',
      group_id: c.group_id || null,
      plan_id: c.plan_id || null,
      username_radius: c.username_radius || '',
      password_radius: '',
      activate_now: !!c.activated_at,
      started_at: c.activated_at ? new Date(c.activated_at) : new Date(),
      expired_at: c.expired_at ? new Date(c.expired_at) : null,
      device_merk: c.device_merk || '',
      device_serial: c.device_serial || '',
      lat: c.lat || null,
      lng: c.lng || null
    }
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal memuat data pelanggan', life: 3000 })
  }
}

watch(() => form.value.lat, () => {
  if (mapInstance && form.value.lat && form.value.lng) {
    mapInstance.setView([form.value.lat, form.value.lng])
    if (marker) mapInstance.removeLayer(marker)
    marker = L.marker([form.value.lat, form.value.lng]).addTo(mapInstance)
  }
})

async function handleSubmit() {
  saving.value = true
  try {
    const payload = {
      fullname: form.value.name,
      phone: form.value.phone || undefined,
      email: form.value.email || undefined,
      nik: form.value.nik || undefined,
      address: form.value.address || undefined,
      group_id: form.value.group_id || undefined,
      plan_id: form.value.plan_id || undefined,
      username_radius: form.value.username_radius || undefined,
      password_radius: form.value.password_radius || undefined,
      device_merk: form.value.device_merk || undefined,
      device_serial: form.value.device_serial || undefined,
      activate_now: form.value.activate_now,
      started_at: form.value.activate_now && form.value.started_at ? form.value.started_at.toISOString() : undefined,
      expired_at: form.value.activate_now && form.value.expired_at ? form.value.expired_at.toISOString() : undefined,
      lat: form.value.lat || undefined,
      lng: form.value.lng || undefined
    }
    if (isEdit.value) {
      await api.put(`/customers/${route.params.id}`, payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pelanggan berhasil diupdate', life: 3000 })
    } else {
      await api.post('/customers', payload)
      toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pelanggan berhasil ditambahkan', life: 3000 })
    }
    router.push('/customers')
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: e.response?.data?.message || 'Gagal menyimpan', life: 3000 })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const [gRes, pRes] = await Promise.all([
      api.get('/groups').catch(() => ({ data: [] })),
      api.get('/plans').catch(() => ({ data: [] }))
    ])
    groups.value = Array.isArray(gRes.data) ? gRes.data : (gRes.data.data || [])
    plans.value = Array.isArray(pRes.data) ? pRes.data : (pRes.data.data || [])
  } catch (e) {}
  if (isEdit.value) await loadEditData()
  initMap()
})
</script>
