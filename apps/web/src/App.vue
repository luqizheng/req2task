<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import MainLayout from './components/layout/MainLayout.vue'

const route = useRoute()
const showLayout = ref(true)

watch(() => route.path, (newPath) => {
  showLayout.value = newPath !== '/login'
}, { immediate: true })
</script>

<template>
  <template v-if="showLayout">
    <MainLayout>
      <RouterView />
    </MainLayout>
  </template>
  <template v-else>
    <RouterView />
  </template>
</template>
