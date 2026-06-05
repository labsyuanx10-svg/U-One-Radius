<template>
  <aside
    :class="[
      'flex flex-col bg-sidebar-bg text-white transition-all duration-300 z-30',
      collapsed ? 'w-16' : 'w-64'
    ]"
  >
    <!-- Logo -->
    <div class="flex items-center h-16 px-4 border-b border-gray-700/50">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <span class="text-white font-bold text-sm">B</span>
        </div>
        <span v-if="!collapsed" class="font-semibold text-base truncate">Billing ISP</span>
      </div>
      <button @click="appStore.toggleSidebar()" class="ml-auto p-1 hover:bg-sidebar-hover rounded-lg transition-colors flex-shrink-0">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-4 px-2 space-y-1">
      <!-- Normal router links -->
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive(item.path, item.exact, item.prefix)
            ? 'bg-primary-600 text-white'
            : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
        ]"
      >
        <span class="text-lg flex-shrink-0">{{ item.icon }}</span>
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
      </router-link>


    </nav>

    <!-- User Info & Logout -->
    <div class="border-t border-gray-700/50 p-3">
      <div v-if="auth.user" class="flex items-center gap-3">
        <div class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
          {{ auth.user.name ? auth.user.name.charAt(0).toUpperCase() : 'U' }}
        </div>
        <div v-if="!collapsed" class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ auth.user.name || 'User' }}</p>
          <p class="text-xs text-gray-400 truncate">{{ auth.user.role || 'Admin' }}</p>
        </div>
        <button @click="handleLogout" class="p-1.5 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors" :title="'Logout'">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { useAppStore } from '../stores/app.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const appStore = useAppStore()

const collapsed = computed(() => appStore.sidebarCollapsed)

const navItems = [
  { path: '/', icon: '📊', label: 'Dashboard', exact: true },
  { path: '/customers', icon: '👥', label: 'Pelanggan', prefix: '/customers' },
  { path: '/plans', icon: '📦', label: 'Paket & Pool', exact: true },
  { path: '/routers', icon: '🖥️', label: 'Router', exact: true },
  { path: '/groups', icon: '🏢', label: 'Group', exact: true },
  { path: '/tickets', icon: '🎫', label: 'Tiket', exact: true },
  { path: '/radacct', icon: '📡', label: 'Status Online', exact: true },
  { path: '/radacct/logradius', icon: '📋', label: 'Log Radius', exact: true },
  { path: '/transactions', icon: '💰', label: 'Tagihan', exact: true },
  { path: '/settings', icon: '⚙️', label: 'Pengaturan', exact: true },
  { path: '/settings/wa', icon: '📲', label: 'WA Setting', exact: true }
]

function isActive(path, exact, prefix) {
  if (exact) return route.path === path
  if (prefix) return route.path.startsWith(prefix)
  return route.path === path
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>
