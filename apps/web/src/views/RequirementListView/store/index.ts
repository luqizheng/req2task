import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RequirementResponseDto } from '@req2task/dto'
import { RequirementStatus, Priority } from '@req2task/dto'
import { requirementsApi, type RequirementListParams } from '@/api/requirements'

export interface Filters {
  status: RequirementStatus | ''
  priority: Priority | ''
}

export interface Pagination {
  page: number
  limit: number
  total: number
}

export const useRequirementStore = defineStore('requirement', () => {
  const requirements = ref<RequirementResponseDto[]>([])
  const filters = ref<Filters>({
    status: '',
    priority: ''
  })
  const pagination = ref<Pagination>({
    page: 1,
    limit: 10,
    total: 0
  })
  const searchQuery = ref('')
  const isLoading = ref(false)

  const totalPages = computed(() => Math.ceil(pagination.value.total / pagination.value.limit))

  const fetchRequirements = async (projectId: string) => {
    isLoading.value = true
    try {
      const params: RequirementListParams = {
        page: pagination.value.page,
        limit: pagination.value.limit,
        status: filters.value.status || undefined,
        priority: filters.value.priority || undefined
      }
      const response = await requirementsApi.getListByProject(projectId, params)
      requirements.value = response.items
      pagination.value.total = response.total
    } catch (error) {
      console.error('Failed to fetch requirements:', error)
    } finally {
      isLoading.value = false
    }
  }

  const setFilters = (newFilters: Partial<Filters>) => {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
  }

  const setSearchQuery = (query: string) => {
    searchQuery.value = query
    pagination.value.page = 1
  }

  const setPage = (page: number) => {
    pagination.value.page = page
  }

  const setPageSize = (limit: number) => {
    pagination.value.limit = limit
    pagination.value.page = 1
  }

  const clearFilters = () => {
    filters.value = { status: '', priority: '' }
    pagination.value.page = 1
  }

  return {
    requirements,
    filters,
    pagination,
    searchQuery,
    isLoading,
    totalPages,
    fetchRequirements,
    setFilters,
    setSearchQuery,
    setPage,
    setPageSize,
    clearFilters
  }
})
