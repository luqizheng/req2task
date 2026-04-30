import 'reflect-metadata'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import './assets/index.css'
import { Toaster } from '@/components/ui/sonner'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('Toaster', Toaster)

app.mount('#app')
