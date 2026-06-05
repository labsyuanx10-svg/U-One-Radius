<template>
  <div class="print-area max-w-[58mm] mx-auto bg-white p-2 text-[10px] leading-tight">
    <!-- Loading / Error -->
    <div v-if="loading" class="text-center py-8">Loading...</div>
    <div v-else-if="error" class="text-center py-8 text-red-600">{{ error }}</div>

    <template v-else-if="invoice">
      <!-- Company Header -->
      <div class="text-center mb-2 pb-2 border-b border-dashed border-gray-300">
        <div class="font-bold text-sm">{{ company.name || 'Billing ISP' }}</div>
        <div class="text-[9px]">{{ company.address || 'Jl. Contoh No. 123' }}</div>
        <div class="text-[9px]">Telp: {{ company.phone || '-' }}</div>
        <div class="text-[9px]">Email: {{ company.email || '-' }}</div>
      </div>

      <!-- Title -->
      <div class="text-center font-bold text-sm mb-2">INVOICE</div>

      <!-- Invoice Info -->
      <div class="flex justify-between mb-1">
        <span class="text-[9px]">No Invoice:</span>
        <span class="font-bold text-[9px]">{{ invoice.invoice_no }}</span>
      </div>
      <div class="flex justify-between mb-1">
        <span class="text-[9px]">Tanggal:</span>
        <span class="text-[9px]">{{ formatDate(invoice.created_at) }}</span>
      </div>
      <div class="flex justify-between mb-2">
        <span class="text-[9px]">Jatuh Tempo:</span>
        <span class="text-[9px]">{{ formatDate(invoice.due_date) }}</span>
      </div>

      <!-- Customer -->
      <div class="mb-2 pb-2 border-b border-dashed border-gray-300">
        <div class="text-[9px] font-bold">Kepada Yth:</div>
        <div class="text-[9px]">{{ invoice.customer_name }}</div>
        <div class="text-[9px]">{{ invoice.customer_address || '-' }}</div>
      </div>

      <!-- Items -->
      <div class="mb-2">
        <div class="flex justify-between font-bold border-b border-gray-300 pb-1 mb-1">
          <span class="text-[9px]">Keterangan</span>
          <span class="text-[9px]">Jumlah</span>
        </div>
        <div class="flex justify-between mb-1">
          <span class="text-[9px]">{{ invoice.description || 'Biaya Langganan ' + (invoice.plan_name || '') }}</span>
          <span class="text-[9px]">{{ formatCurrency(invoice.amount) }}</span>
        </div>
      </div>

      <!-- Total -->
      <div class="flex justify-between font-bold border-t border-dashed border-gray-300 pt-1 mb-2">
        <span class="text-[10px]">TOTAL</span>
        <span class="text-[10px]">{{ formatCurrency(invoice.amount) }}</span>
      </div>

      <!-- Status -->
      <div class="text-center mb-2">
        <span :class="invoice.status === 'paid' ? 'text-green-700' : 'text-red-700'" class="font-bold text-[11px]">
          {{ invoice.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS' }}
        </span>
      </div>

      <!-- Bank Info -->
      <div class="border-t border-dashed border-gray-300 pt-2 mb-2">
        <div class="text-[9px] font-bold mb-1">Pembayaran Via Transfer:</div>
        <div v-if="banks.length > 0">
          <div v-for="b in banks" :key="b.id" class="mb-1">
            <div class="text-[9px]">{{ b.bank_name }}</div>
            <div class="text-[9px] font-bold">{{ b.account_number }}</div>
            <div class="text-[9px]">a.n. {{ b.account_name }}</div>
          </div>
        </div>
        <div v-else class="text-[9px]">BCA: 1234567890 a.n. Billing ISP</div>
      </div>

      <!-- Footer -->
      <div class="text-center text-[8px] text-gray-400 border-t border-dashed border-gray-300 pt-1">
        Terima kasih telah menggunakan layanan kami
      </div>

      <!-- Print Button (hidden in print) -->
      <div class="no-print text-center mt-4">
        <button @click="windowPrint" class="btn-primary text-sm">Cetak / Simpan PDF</button>
        <button @click="goBack" class="btn-secondary text-sm ml-2">Kembali</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../api/axios.js'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const invoice = ref(null)
const company = ref({ name: 'Billing ISP', address: '', phone: '', email: '' })
const banks = ref([])

function formatDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCurrency(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
}

function windowPrint() { window.print() }
function goBack() { router.push('/transactions') }

onMounted(async () => {
  try {
    const id = route.params.id
    const [txRes, settingsRes] = await Promise.all([
      api.get(`/transactions/${id}`).catch(() => ({ data: null })),
      api.get('/settings/company').catch(() => ({ data: {} }))
    ])
    if (!txRes.data) { error.value = 'Invoice tidak ditemukan'; return }
    invoice.value = txRes.data

    const s = settingsRes.data
    company.value = {
      name: s.app_name || 'Billing ISP',
      address: s.address || '',
      phone: s.phone || '',
      email: s.email || ''
    }

    const bankRes = await api.get('/settings/banks').catch(() => ({ data: [] }))
    banks.value = Array.isArray(bankRes.data) ? bankRes.data : (bankRes.data.data || [])
  } catch (e) {
    error.value = 'Gagal memuat invoice'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
@media print {
  .no-print { display: none !important; }
}
</style>
