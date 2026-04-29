<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'

const route = useRoute()
const isAuthLayout = route.meta.layout === 'auth'
</script>

<template>
  <template v-if="isAuthLayout">
    <RouterView />
  </template>
  <template v-else>
    <RouterView />
  </template>
  <Toaster position="top-center" richColors />
</template>
