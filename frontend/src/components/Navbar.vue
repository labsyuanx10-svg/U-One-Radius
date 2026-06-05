<template>
  <header class="bg-white border-b border-gray-200 h-16 flex items-center px-6 sticky top-0 z-20">
    <div class="flex-1 flex items-center gap-4">
      <h1 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h1>
      <nav class="hidden md:flex items-center gap-2 text-sm text-gray-400">
        <span v-for="(crumb, i) in breadcrumbs" :key="i">
          <span v-if="i > 0" class="mx-1">/</span>
          <router-link v-if="crumb.path" :to="crumb.path" class="hover:text-gray-600 transition-colors">{{ crumb.label }}</router-link>
          <span v-else>{{ crumb.label }}</span>
        </span>
      </nav>
    </div>
    <div class="flex items-center gap-4">
      <!-- Notifications -->
      <button class="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span v-if="notificationCount > 0" class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{{ notificationCount }}</span>
      </button>
      <!-- User -->
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-sm font-semibold text-primary-700">
          {{ userInitial }}
        </div>
        <span class="hidden md:block text-sm font-medium text-gray-700">{{ userName }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const route = useRoute()
const auth = useAuthStore()

const pageTitles = {
  '/': 'Dashboard',
  '/customers': 'Pelanggan',
  '/plans': 'Paket & IP Pool',
  '/routers': 'Router',
  '/groups': 'Group',
  '/tickets': 'Tiket',
  '/transactions': 'Tagihan',
  '/settings': 'Pengaturan'
}

const breadcrumbMap = {
  '/customers': [{ label: 'Pelanggan' }],
  '/plans': [{ label: 'Paket & IP Pool' }],
  '/routers': [{ label: 'Router' }],
  '/groups': [{ label: 'Group' }],
  '/tickets': [{ label: 'Tiket' }],
  '/transactions': [{ label: 'Tagihan' }],
  '/settings': [{ label: 'Pengaturan' }]
}

const pageTitle = computed(() => pageTitles[route.path] || 'Billing ISP')
const breadcrumbs = computed(() => {
  if (route.path.startsWith('/customers')) {
    if (route.path === '/customers/new') return [{ label: 'Pelanggan', path: '/customers' }, { label: 'Tambah' }]
    if (route.path.includes('/edit')) return [{ label: 'Pelanggan', path: '/customers' }, { label: 'Edit' }]
    if (route.params.id) return [{ label: 'Pelanggan', path: '/customers' }, { label: 'Detail' }]
    return [{ label: 'Pelanggan' }]
  }
  return breadcrumbMap[route.path] || []
})

const notificationCount = computed(() => 0)

const userName = computed(() => auth.user?.name || 'User')
const userInitial = computed(() => {
  const name = auth.user?.name || 'U'
  return name.charAt(0).toUpperCase()
})
</script>
