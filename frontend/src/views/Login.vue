<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur rounded-2xl mb-4">
          <span class="text-white font-bold text-2xl">B</span>
        </div>
        <h1 class="text-2xl font-bold text-white">Billing ISP</h1>
        <p class="text-primary-200 mt-1">Panel Administrasi</p>
      </div>

      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-lock"></i>
            <span>Masuk</span>
          </div>
        </template>
        <template #content>
          <Message v-if="error" severity="error" :closable="false" class="mb-4">
            {{ error }}
          </Message>

          <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <IconField>
                <InputIcon class="pi pi-user" />
                <InputText
                  v-model="username"
                  type="text"
                  class="w-full"
                  placeholder="Masukkan username"
                  autocomplete="username"
                  required
                />
              </IconField>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <IconField>
                <InputIcon class="pi pi-lock" />
                <InputText
                  v-model="password"
                  type="password"
                  class="w-full"
                  placeholder="Masukkan password"
                  autocomplete="current-password"
                  required
                />
              </IconField>
            </div>
            <Button
              type="submit"
              :loading="loading"
              label="Masuk"
              icon="pi pi-sign-in"
              class="w-full"
              severity="primary"
              :disabled="loading"
            />
          </form>
        </template>
      </Card>

      <p class="text-center text-primary-300 text-sm mt-6">© 2025 Billing ISP. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.message || 'Login gagal. Periksa username dan password.'
  } finally {
    loading.value = false
  }
}
</script>
