<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-6">Dashboard</h2>

    <div v-if="loading" class="flex items-center justify-center py-20">
      <i class="pi pi-spin pi-spinner text-4xl text-primary-600"></i>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Pelanggan" :value="stats.total || 0" icon="👥" color="blue" />
        <StatCard title="Aktif" :value="stats.active || 0" icon="✅" color="green" />
        <StatCard title="Expired / Isolir" :value="stats.expired || 0" icon="❌" color="red" />
        <StatCard title="Revenue Bulan Ini" :value="formatCurrency(stats.revenue || 0)" icon="💰" color="amber" />
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <template #title>Pelanggan per Status</template>
          <template #content>
            <div class="flex items-end gap-4 h-48">
              <div class="flex-1 flex flex-col items-center gap-2">
                <span class="text-xs text-gray-500">{{ stats.active || 0 }}</span>
                <div class="w-12 bg-green-500 rounded-t-md" :style="{ height: barHeight(stats.active) }"></div>
                <span class="text-xs font-medium text-gray-600">Aktif</span>
              </div>
              <div class="flex-1 flex flex-col items-center gap-2">
                <span class="text-xs text-gray-500">{{ stats.expired || 0 }}</span>
                <div class="w-12 bg-red-500 rounded-t-md" :style="{ height: barHeight(stats.expired) }"></div>
                <span class="text-xs font-medium text-gray-600">Expired</span>
              </div>
              <div class="flex-1 flex flex-col items-center gap-2">
                <span class="text-xs text-gray-500">{{ stats.isolir || 0 }}</span>
                <div class="w-12 bg-amber-500 rounded-t-md" :style="{ height: barHeight(stats.isolir) }"></div>
                <span class="text-xs font-medium text-gray-600">Isolir</span>
              </div>
            </div>
          </template>
        </Card>
        <Card>
          <template #title>Revenue 6 Bulan</template>
          <template #content>
            <div class="flex items-end gap-3 h-48">
              <div v-for="(m, i) in monthlyRevenue" :key="i" class="flex-1 flex flex-col items-center gap-2">
                <span class="text-xs text-gray-500">Rp{{ m.amount }}</span>
                <div class="w-8 bg-primary-500 rounded-t-md" :style="{ height: revenueBar(m.amount) }"></div>
                <span class="text-xs text-gray-500">{{ m.month }}</span>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span>Transaksi Terbaru</span>
              <router-link to="/transactions" class="text-sm text-primary-600 hover:text-primary-700">Lihat Semua</router-link>
            </div>
          </template>
          <template #content>
            <div v-if="recentTransactions.length === 0" class="text-center py-8 text-gray-400 text-sm">
              Belum ada transaksi
            </div>
            <div v-else class="space-y-3">
              <div v-for="tx in recentTransactions" :key="tx.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ tx.customer_name }}</p>
                  <p class="text-xs text-gray-400">{{ tx.invoice_no }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold" :class="tx.status === 'paid' ? 'text-green-600' : 'text-red-600'">
                    {{ formatCurrency(tx.amount) }}
                  </p>
                  <Tag :value="tx.status === 'paid' ? 'Lunas' : 'Belum Bayar'" :severity="tx.status === 'paid' ? 'success' : 'danger'" />
                </div>
              </div>
            </div>
          </template>
        </Card>
        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span>Tiket Terbaru</span>
              <router-link to="/tickets" class="text-sm text-primary-600 hover:text-primary-700">Lihat Semua</router-link>
            </div>
          </template>
          <template #content>
            <div v-if="recentTickets.length === 0" class="text-center py-8 text-gray-400 text-sm">
              Belum ada tiket
            </div>
            <div v-else class="space-y-3">
              <div v-for="ticket in recentTickets" :key="ticket.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ ticket.subject }}</p>
                  <p class="text-xs text-gray-400">{{ ticket.customer_name }}</p>
                </div>
                <Tag :value="statusLabel(ticket.status)" :severity="statusSeverity(ticket.status)" />
              </div>
            </div>
          </template>
        </Card>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api/axios.js'
import StatCard from '../components/StatCard.vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'

const loading = ref(true)
const stats = ref({ total: 0, active: 0, expired: 0, isolir: 0, revenue: 0 })
const recentTransactions = ref([])
const recentTickets = ref([])
const monthlyRevenue = ref([
  { month: 'Jan', amount: 0 },
  { month: 'Feb', amount: 0 },
  { month: 'Mar', amount: 0 },
  { month: 'Apr', amount: 0 },
  { month: 'Mei', amount: 0 },
  { month: 'Jun', amount: 0 }
])

function formatCurrency(val) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
}

function barHeight(val) {
  const max = Math.max(stats.value.total, 1)
  return Math.max((val / max) * 180, 4) + 'px'
}

function revenueBar(val) {
  const max = Math.max(...monthlyRevenue.value.map(m => m.amount), 1)
  return Math.max((val / max) * 180, 4) + 'px'
}

function statusLabel(status) {
  const map = { open: 'Open', closed: 'Closed', pending: 'Pending' }
  return map[status] || status
}

function statusSeverity(status) {
  const map = { open: 'info', closed: 'secondary', pending: 'warn' }
  return map[status] || 'secondary'
}

onMounted(async () => {
  try {
    const [statsRes, txRes, ticketRes] = await Promise.all([
      api.get('/dashboard/stats').catch(() => ({ data: { total: 0, active: 0, expired: 0, isolir: 0, revenue: 0 } })),
      api.get('/transactions?limit=5').catch(() => ({ data: [] })),
      api.get('/tickets?limit=5').catch(() => ({ data: [] }))
    ])
    stats.value = statsRes.data
    recentTransactions.value = Array.isArray(txRes.data) ? txRes.data : (txRes.data.data || [])
    recentTickets.value = Array.isArray(ticketRes.data) ? ticketRes.data : (ticketRes.data.data || [])
  } catch (e) {
  } finally {
    loading.value = false
  }
})
</script>
