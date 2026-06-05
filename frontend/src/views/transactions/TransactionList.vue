<template>
  <div>
    <Toolbar class="mb-6">
      <template #start>
        <h2 class="text-xl font-bold text-gray-800">Tagihan</h2>
      </template>
    </Toolbar>

    <Card class="mb-6">
      <template #content>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Select v-model="filterStatus" :options="statusFilterOptions" placeholder="Semua Status" class="w-full" @change="page=1; loadData()" />
          </div>
          <div>
            <DatePicker v-model="dateFrom" class="w-full" dateFormat="dd/mm/yy" placeholder="Dari tgl" @update:modelValue="page=1; loadData()" />
          </div>
          <div>
            <DatePicker v-model="dateTo" class="w-full" dateFormat="dd/mm/yy" placeholder="Sampai tgl" @update:modelValue="page=1; loadData()" />
          </div>
          <div>
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText v-model="search" placeholder="Cari invoice/customer..." class="w-full" @input="debouncedSearch" />
            </IconField>
          </div>
        </div>
      </template>
    </Card>

    <Card>
      <template #content>
        <div v-if="loading" class="flex items-center justify-center py-20">
          <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
        </div>
        <DataTable v-else :value="transactions" stripedRows paginator :rows="perPage" :totalRecords="total" :lazy="true" :first="(page-1)*perPage" @page="onPage" class="p-datatable-sm">
          <Column field="invoice_no" header="Invoice"></Column>
          <Column field="customer_name" header="Pelanggan"></Column>
          <Column field="amount" header="Jumlah">
            <template #body="{ data }">
              <span class="font-semibold">{{ formatCurrency(data.amount) }}</span>
            </template>
          </Column>
          <Column field="type" header="Tipe"></Column>
          <Column field="status" header="Status">
            <template #body="{ data }">
              <Tag :value="data.status === 'paid' ? 'Lunas' : 'Belum Bayar'" :severity="data.status === 'paid' ? 'success' : 'danger'" />
            </template>
          </Column>
          <Column field="due_date" header="Jatuh Tempo">
            <template #body="{ data }">{{ formatDate(data.due_date) }}</template>
          </Column>
          <Column header="Aksi" style="width:180px">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button v-if="data.status !== 'paid'" label="Lunas" severity="success" size="small" @click="confirmPay(data)" />
                <Button :label="sendingMap[data.id] ? 'Mengirim...' : 'Kirim WA'" :disabled="sendingMap[data.id]" severity="info" size="small" @click="sendWaReminder(data)" />
                <Button label="Cetak" severity="secondary" size="small" @click="printInvoice(data)" />
              </div>
            </template>
          </Column>
          <template #empty>
            <div class="text-center py-12 text-gray-400">
              <i class="pi pi-receipt text-4xl block mb-2"></i>
              <span>Belum ada tagihan</span>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <Dialog v-model:visible="payModal" header="Konfirmasi Pembayaran" :modal="true" class="w-full max-w-sm">
      <p class="text-gray-600 mb-4">Tandai invoice <strong>{{ payTarget?.invoice_no }}</strong> sebagai Lunas?</p>
      <div class="flex justify-end gap-3">
        <Button label="Batal" severity="secondary" @click="payModal = false" />
        <Button label="Ya, Lunas" severity="success" :loading="paying" @click="doPay" />
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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
import InputIcon from 'primevue/inputicon'
import IconField from 'primevue/iconfield'
import Select from 'primevue/select'
import DatePicker from 'primevue/datepicker'
import Tag from 'primevue/tag'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const transactions = ref([])
const loading = ref(true)
const filterStatus = ref(null)
const dateFrom = ref(null)
const dateTo = ref(null)
const search = ref('')
const page = ref(1)
const totalPages = ref(1)
const total = ref(0)
const perPage = ref(20)

const payModal = ref(false)
const paying = ref(false)
const payTarget = ref(null)
const sendingMap = ref({})

const statusFilterOptions = [
  { label: 'Semua Status', value: null },
  { label: 'Belum Bayar', value: 'unpaid' },
  { label: 'Lunas', value: 'paid' }
]

function formatCurrency(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
}
function formatDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-' }

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
    if (filterStatus.value) params.status = filterStatus.value
    if (dateFrom.value) params.date_from = dateFrom.value.toISOString().split('T')[0]
    if (dateTo.value) params.date_to = dateTo.value.toISOString().split('T')[0]
    if (search.value) params.search = search.value
    const res = await api.get('/transactions', { params }).catch(() => ({ data: { data: [], total: 0 } }))
    const data = res.data
    transactions.value = Array.isArray(data) ? data : (data.data || [])
    total.value = data.total || transactions.value.length
    totalPages.value = data.last_page || Math.ceil(total.value / perPage.value) || 1
  } catch (e) { transactions.value = [] }
  finally { loading.value = false }
}

function confirmPay(tx) {
  confirm.require({
    message: `Tandai invoice <strong>${tx.invoice_no}</strong> sebagai Lunas?`,
    header: 'Konfirmasi Pembayaran',
    icon: 'pi pi-check-circle',
    rejectLabel: 'Batal',
    acceptLabel: 'Ya, Lunas',
    accept: async () => {
      try {
        await api.post(`/transactions/${tx.id}/pay`)
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pembayaran berhasil dicatat', life: 3000 })
        loadData()
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Gagal mencatat pembayaran', life: 3000 })
      }
    }
  })
}

async function sendWaReminder(tx) {
  if (sendingMap.value[tx.id]) return
  sendingMap.value = { ...sendingMap.value, [tx.id]: true }
  try {
    await api.post(`/transactions/${tx.id}/send-wa`)
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pesan WA terkirim', life: 3000 })
  } catch (e) {
    const err = e.response?.data?.error || 'Gagal kirim WA'
    toast.add({ severity: 'error', summary: 'Gagal', detail: err, life: 5000 })
  } finally {
    sendingMap.value = { ...sendingMap.value, [tx.id]: false }
  }
}

function printInvoice(tx) {
  router.push(`/transactions/${tx.id}/print`)
}

onMounted(() => { loadData() })
</script>
