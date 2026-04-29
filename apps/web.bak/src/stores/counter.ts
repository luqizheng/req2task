import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    version: '0.1.0'
  })
})
