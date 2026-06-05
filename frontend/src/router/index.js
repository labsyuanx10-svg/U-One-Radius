import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/customers',
    name: 'CustomerList',
    component: () => import('../views/customers/CustomerList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/customers/new',
    name: 'CustomerNew',
    component: () => import('../views/customers/CustomerForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/customers/:id',
    name: 'CustomerDetail',
    component: () => import('../views/customers/CustomerDetail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/customers/:id/edit',
    name: 'CustomerEdit',
    component: () => import('../views/customers/CustomerForm.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/plans',
    name: 'Plans',
    component: () => import('../views/plans/PlansView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/routers',
    name: 'Routers',
    component: () => import('../views/routers/RouterList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/groups',
    name: 'Groups',
    component: () => import('../views/groups/GroupList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/tickets',
    name: 'Tickets',
    component: () => import('../views/tickets/TicketList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/transactions',
    name: 'Transactions',
    component: () => import('../views/transactions/TransactionList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/transactions/:id/print',
    name: 'InvoicePrint',
    component: () => import('../views/transactions/InvoicePrint.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/radacct',
    name: 'StatusOnline',
    component: () => import('../views/radacct/StatusOnline.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/radacct/logradius',
    name: 'LogRadius',
    component: () => import('../views/radacct/LogRadius.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/settings/SettingsView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth !== false && !auth.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && auth.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
