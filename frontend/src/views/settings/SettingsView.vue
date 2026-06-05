<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-6">Pengaturan</h2>

    <Card>
      <template #content>
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="company">🏢 Profil Perusahaan</Tab>
            <Tab value="uid">🔢 Format UID</Tab>
            <Tab value="invoice">📄 Invoice</Tab>
            <Tab value="isolir">🔌 Auto Isolir</Tab>
            <Tab value="notification">🔔 Notifikasi</Tab>
            <Tab value="payment">💳 Pembayaran</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="company">
              <h3 class="text-base font-semibold mb-4">Profil Perusahaan</h3>
              <form @submit.prevent="saveCompany" class="space-y-4 max-w-lg">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Nama Aplikasi</label>
                  <InputText v-model="company.app_name" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <Textarea v-model="company.address" class="w-full" rows="2" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                  <InputText v-model="company.phone" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <InputText v-model="company.email" type="email" class="w-full" />
                </div>
                <Button type="submit" :loading="saving" label="Simpan" severity="primary" />
              </form>
            </TabPanel>

            <TabPanel value="uid">
              <h3 class="text-base font-semibold mb-4">Format UID Pelanggan</h3>
              <form @submit.prevent="saveUid" class="space-y-4 max-w-lg">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Prefix</label>
                  <InputText v-model="uid.prefix" class="w-full" placeholder="C" />
                  <p class="text-xs text-gray-400 mt-1">Contoh: C-0001</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah Digit</label>
                  <InputNumber v-model="uid.digits" class="w-full" :min="1" :max="10" />
                  <p class="text-xs text-gray-400 mt-1">Contoh: 4 digit → 0001</p>
                </div>
                <Button type="submit" :loading="saving" label="Simpan" severity="primary" />
              </form>
            </TabPanel>

            <TabPanel value="invoice">
              <h3 class="text-base font-semibold mb-4">Format Invoice</h3>
              <form @submit.prevent="saveInvoice" class="space-y-4 max-w-lg">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Header</label>
                  <InputText v-model="invoice.header" class="w-full" placeholder="INVOICE" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Alamat (footer)</label>
                  <Textarea v-model="invoice.address" class="w-full" rows="2" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Footer</label>
                  <Textarea v-model="invoice.footer" class="w-full" rows="2" placeholder="Terima kasih" />
                </div>
                <div class="flex items-center gap-4">
                  <div class="flex items-center gap-2">
                    <ToggleSwitch v-model="invoice.ppn_enabled" />
                    <span class="text-sm text-gray-700">Aktifkan PPN</span>
                  </div>
                  <div v-if="invoice.ppn_enabled" class="w-24">
                    <InputNumber v-model="invoice.ppn_percent" class="w-full" :min="0" :max="100" suffix="%" />
                  </div>
                </div>
                <Button type="submit" :loading="saving" label="Simpan" severity="primary" />
              </form>
            </TabPanel>

            <TabPanel value="isolir">
              <h3 class="text-base font-semibold mb-4">Auto Isolir</h3>
              <form @submit.prevent="saveIsolir" class="space-y-4 max-w-lg">
                <div class="flex items-center gap-3">
                  <ToggleSwitch v-model="isolir.enabled" />
                  <span class="text-sm text-gray-700">Aktifkan Auto Isolir</span>
                </div>
                <div v-if="isolir.enabled">
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Metode</label>
                    <Select v-model="isolir.method" :options="isolirMethodOptions" class="w-full" />
                  </div>
                  <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Isolir Plan</label>
                    <Select v-model="isolir.plan_id" :options="planOptions" placeholder="Pilih Plan (opsional)" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Jadwal Cron</label>
                    <InputText v-model="isolir.cron" class="w-full" placeholder="0 0 * * *" />
                    <p class="text-xs text-gray-400 mt-1">Default: setiap jam 00:00</p>
                  </div>
                </div>
                <Button type="submit" :loading="saving" label="Simpan" severity="primary" />
              </form>
            </TabPanel>

            <TabPanel value="notification">
              <h3 class="text-base font-semibold mb-4">Template Notifikasi</h3>
              <Message severity="info" :closable="false" class="mb-4">
                <p class="font-medium mb-1">Variable yang tersedia:</p>
                <code class="text-xs">{nama}, {uid}, {paket}, {jatuh_tempo}, {harga}, {invoice}, {group}, {no_hp}</code>
              </Message>
              <form @submit.prevent="saveNotification" class="space-y-4 max-w-lg">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp - Tagihan Baru</label>
                  <Textarea v-model="notif.tagihan_baru" class="w-full" rows="3" placeholder="Halo {nama}, tagihan..." />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp - Jatuh Tempo</label>
                  <Textarea v-model="notif.jatuh_tempo" class="w-full" rows="3" placeholder="Halo {nama}, ingatkan..." />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp - Isolir</label>
                  <Textarea v-model="notif.isolir" class="w-full" rows="3" placeholder="Halo {nama}, akun diisolir..." />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">WhatsApp - Pembayaran</label>
                  <Textarea v-model="notif.pembayaran" class="w-full" rows="3" placeholder="Halo {nama}, terima kasih..." />
                </div>
                <Button type="submit" :loading="saving" label="Simpan" severity="primary" />
              </form>
            </TabPanel>

            <TabPanel value="payment">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-semibold">Informasi Bank</h3>
                <Button label="Tambah Bank" icon="pi pi-plus" severity="primary" size="small" @click="addBank" />
              </div>
              <div v-if="banks.length === 0" class="text-center py-8 text-gray-400 text-sm">Belum ada bank</div>
              <div v-for="(b, i) in banks" :key="i" class="border border-gray-100 rounded-lg p-4 mb-3">
                <form @submit.prevent="saveBank(i)" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Nama Bank</label>
                    <InputText v-model="b.bank_name" class="w-full text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">No Rekening</label>
                    <InputText v-model="b.account_number" class="w-full text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Atas Nama</label>
                    <InputText v-model="b.account_name" class="w-full text-sm" />
                  </div>
                  <div class="flex items-end gap-2">
                    <Button type="submit" :loading="saving" label="Simpan" severity="primary" size="small" />
                    <Button label="Hapus" severity="danger" size="small" @click="deleteBank(i)" />
                  </div>
                </form>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import api from '../../api/axios.js'
import Card from 'primevue/card'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Message from 'primevue/message'

const toast = useToast()

const activeTab = ref('company')
const saving = ref(false)
const plans = ref([])

const isolirMethodOptions = [
  { label: 'Disable Interface', value: 'disable' },
  { label: 'Speed Limit (Throttle)', value: 'speed_limit' },
  { label: 'Move to Isolir Pool', value: 'move_pool' }
]
const planOptions = ref([])

const company = ref({ app_name: '', address: '', phone: '', email: '' })
const uid = ref({ prefix: 'C', digits: 4 })
const invoice = ref({ header: 'INVOICE', address: '', footer: 'Terima kasih', ppn_enabled: false, ppn_percent: 11 })
const isolir = ref({ enabled: false, method: 'disable', plan_id: null, cron: '0 0 * * *' })
const notif = ref({ tagihan_baru: '', jatuh_tempo: '', isolir: '', pembayaran: '' })
const banks = ref([])

async function loadData() {
  try {
    const keys = ['company', 'uid_format', 'invoice_format', 'auto_isolir', 'notifications', 'banks']
    const res = await api.get('/settings', { params: { keys: keys.join(',') } }).catch(() => ({ data: {} }))
    const s = res.data
    if (s.company) company.value = { ...company.value, ...s.company }
    if (s.uid_format) uid.value = { ...uid.value, ...s.uid_format }
    if (s.invoice_format) invoice.value = { ...invoice.value, ...s.invoice_format }
    if (s.auto_isolir) isolir.value = { ...isolir.value, ...s.auto_isolir }
    if (s.notifications) notif.value = { ...notif.value, ...s.notifications }
    if (s.banks) {
      banks.value = Array.isArray(s.banks) ? s.banks : (s.banks.data || [])
    }
    const planRes = await api.get('/plans').catch(() => ({ data: [] }))
    plans.value = Array.isArray(planRes.data) ? planRes.data : (planRes.data.data || [])
    planOptions.value = [
      { label: 'Pilih Plan (opsional)', value: null },
      ...plans.value.map(p => ({ label: p.name, value: p.id }))
    ]
  } catch (e) {}
}

async function saveCompany() {
  saving.value = true
  try { await api.put('/settings/company', company.value); toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Profil tersimpan', life: 3000 }) }
  catch (e) { toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan', life: 3000 }) }
  finally { saving.value = false }
}
async function saveUid() {
  saving.value = true
  try { await api.put('/settings/uid-format', uid.value); toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Format UID tersimpan', life: 3000 }) }
  catch (e) { toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan', life: 3000 }) }
  finally { saving.value = false }
}
async function saveInvoice() {
  saving.value = true
  try { await api.put('/settings/invoice-format', invoice.value); toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Format invoice tersimpan', life: 3000 }) }
  catch (e) { toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan', life: 3000 }) }
  finally { saving.value = false }
}
async function saveIsolir() {
  saving.value = true
  try { await api.put('/settings/auto-isolir', isolir.value); toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Auto isolir tersimpan', life: 3000 }) }
  catch (e) { toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan', life: 3000 }) }
  finally { saving.value = false }
}
async function saveNotification() {
  saving.value = true
  try { await api.put('/settings/notifications', notif.value); toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Notifikasi tersimpan', life: 3000 }) }
  catch (e) { toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan', life: 3000 }) }
  finally { saving.value = false }
}
function addBank() {
  banks.value.push({ bank_name: '', account_number: '', account_name: '' })
}
async function saveBank(idx) {
  saving.value = true
  try { await api.put('/settings/banks', { banks: banks.value }); toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Bank tersimpan', life: 3000 }) }
  catch (e) { toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menyimpan', life: 3000 }) }
  finally { saving.value = false }
}
async function deleteBank(idx) {
  banks.value.splice(idx, 1)
  try { await api.put('/settings/banks', { banks: banks.value }); toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Bank dihapus', life: 3000 }) }
  catch (e) { toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal menghapus', life: 3000 }) }
}

onMounted(() => { loadData() })
</script>
