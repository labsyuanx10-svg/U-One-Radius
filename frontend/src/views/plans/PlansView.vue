<template>
  <div>
    <h2 class="text-xl font-bold text-gray-800 mb-6">Paket & IP Pool</h2>
    <Card>
      <template #content>
        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="plans">📦 Daftar Paket</Tab>
            <Tab value="pools">🌐 IP Pool</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="plans">
              <PlanList />
            </TabPanel>
            <TabPanel value="pools">
              <PoolList />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PlanList from './PlanList.vue'
import PoolList from './PoolList.vue'
import Card from 'primevue/card'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

const activeTab = ref('plans')
</script>
