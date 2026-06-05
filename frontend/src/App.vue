<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <div v-if="loading" class="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary-600 mb-4"></i>
        <p class="text-gray-500 text-sm">Memuat...</p>
      </div>
    </div>
    <Sidebar v-if="!isLoginPage" />
    <div :class="['flex-1 flex flex-col overflow-hidden', { 'ml-0': isLoginPage }]">
      <Navbar v-if="!isLoginPage" />
      <main :class="['flex-1 overflow-y-auto p-6', { 'p-0': isLoginPage }]">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <keep-alive max="5">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth.js'
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const loading = ref(true)

const isLoginPage = computed(() => route.path === '/login')

onMounted(() => {
  auth.checkAuth()

  const routesToPreload = [
    () => import('./views/Dashboard.vue'),
    () => import('./views/customers/CustomerList.vue'),
    () => import('./views/customers/CustomerDetail.vue'),
    () => import('./views/customers/CustomerForm.vue'),
    () => import('./views/plans/PlansView.vue'),
    () => import('./views/routers/RouterList.vue'),
    () => import('./views/groups/GroupList.vue'),
    () => import('./views/tickets/TicketList.vue'),
    () => import('./views/transactions/TransactionList.vue'),
    () => import('./views/transactions/InvoicePrint.vue'),
    () => import('./views/settings/SettingsView.vue'),
  ]

  setTimeout(() => {
    routesToPreload.forEach(route => route().catch(() => {}))
  }, 1000)

  if (!auth.isAuthenticated && route.path !== '/login') {
    router.push('/login')
  }

  loading.value = false
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
