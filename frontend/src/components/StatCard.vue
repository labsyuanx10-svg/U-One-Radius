<template>
  <div class="card">
    <div class="flex items-center gap-4">
      <div :class="['w-12 h-12 rounded-xl flex items-center justify-center text-2xl', iconBgClass]">
        {{ icon }}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm text-gray-500">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-800">{{ value }}</p>
      </div>
    </div>
    <div v-if="trend" class="mt-3 pt-3 border-t border-gray-100">
      <span :class="['text-xs font-medium', trend.up ? 'text-green-600' : 'text-red-600']">
        {{ trend.up ? '↑' : '↓' }} {{ trend.value }}
      </span>
      <span class="text-xs text-gray-400 ml-1">dari bulan lalu</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: String, default: '📊' },
  color: { type: String, default: 'blue' },
  trend: { type: Object, default: null }
})

const iconBgClass = computed(() => {
  const map = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600'
  }
  return map[props.color] || map.blue
})
</script>
