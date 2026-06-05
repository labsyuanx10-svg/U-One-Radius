<template>
  <div>
    <Toolbar class="mb-6">
      <template #start>
        <h2 class="text-xl font-bold text-gray-800">WhatsApp Gateway</h2>
      </template>
      <template #end>
        <Button label="Simpan" icon="pi pi-save" :loading="saving" @click="saveSettings" />
      </template>
    </Toolbar>

    <Card>
      <template #content>
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm text-gray-500">Konfigurasi koneksi ke WhatsApp Gateway (OpenWA).</p>
          <a href="http://10.10.33.52:3001" target="_blank" rel="noopener noreferrer" class="text-sm text-primary-600 hover:text-primary-800 underline inline-flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Buka Dashboard OpenWA
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">API URL <span class="text-red-500">*</span></label>
            <InputText v-model="form.wa_api_url" class="w-full" placeholder="http://192.168.1.100:3000" />
            <p class="text-xs text-gray-400 mt-1">URL server WA Gateway, tanpa trailing slash</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">API Key <span class="text-red-500">*</span></label>
            <InputText v-model="form.wa_api_key" class="w-full" placeholder="uone2025 (default)" />
            <p class="text-xs text-gray-400 mt-1">Authorization Bearer token</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
            <InputText v-model="form.wa_session" class="w-full" placeholder="default" />
            <p class="text-xs text-gray-400 mt-1">Nama session di WA Gateway (default kalo kosong)</p>
          </div>
        </div>

        <Divider class="my-6" />

        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Test Kirim</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Tujuan</label>
            <InputText v-model="testPhone" class="w-full" placeholder="08xxx atau 628xxx" />
          </div>
          <div class="flex items-end">
            <Button label="Kirim Test" icon="pi pi-send" severity="info" :loading="testing" @click="sendTest" />
          </div>
        </div>

        <div v-if="testResult" :class="['mt-4 p-3 rounded text-sm', testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200']">
          <i :class="testResult.success ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'" class="mr-2"></i>
          {{ testResult.message }}
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '../../api/axios.js'
import Toolbar from 'primevue/toolbar'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Divider from 'primevue/divider'

const toast = useToast()

const saving = ref(false)
const testing = ref(false)
const testPhone = ref('')
const testResult = ref(null)

const form = ref({
  wa_api_url: '',
  wa_api_key: '',
  wa_session: 'default'
})

async function loadSettings() {
  try {
    const res = await api.get('/settings')
    const data = Array.isArray(res.data) ? res.data : (res.data.data || [])
    data.forEach(s => {
      if (s.key in form.value) form.value[s.key] = s.value
    })
  } catch (e) {}
}

async function saveSettings() {
  saving.value = true
  try {
    await api.put('/settings', form.value)
    toast.add({ severity: 'success', summary: 'Tersimpan', detail: 'Pengaturan WA Gateway disimpan', life: 3000 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan', life: 3000 })
  } finally {
    saving.value = false
  }
}

async function sendTest() {
  if (!testPhone.value) {
    toast.add({ severity: 'warn', summary: 'Isi dulu nomor', life: 3000 })
    return
  }
  testing.value = true
  testResult.value = null
  try {
    const res = await api.post('/wa/test', { phone: testPhone.value, message: 'Test koneksi dari U-One Radius. Kalo lo terima ini, WA Gateway jalan! ✅' })
    testResult.value = { success: true, message: res.data.message || 'Pesan test terkirim!' }
  } catch (e) {
    const err = e.response?.data?.error || 'Gagal kirim test'
    testResult.value = { success: false, message: err }
  } finally {
    testing.value = false
  }
}

onMounted(() => { loadSettings() })
</script>
