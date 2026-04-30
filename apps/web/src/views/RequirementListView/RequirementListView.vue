<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, ListFilter } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useRequirementStore } from './store'
import { showToast } from '@/lib/toast'
import RequirementSearch from './components/RequirementSearch.vue'
import RequirementFilters from './components/RequirementFilters.vue'
import RequirementTable from './components/RequirementTable.vue'

const route = useRoute()
const router = useRouter()
const store = useRequirementStore()

const projectId = route.params.projectId as string

const handleSearch = () => {
  store.fetchRequirements(projectId)
  showToast.success('搜索完成')
}

const handleFiltersChange = (filters: any) => {
  store.setFilters(filters)
  store.fetchRequirements(projectId)
  showToast.success('筛选条件已应用')
}

const handlePageChange = (page: number) => {
  store.setPage(page)
  store.fetchRequirements(projectId)
}

const handleClearFilters = () => {
  store.clearFilters()
  store.fetchRequirements(projectId)
}

const handleView = (id: string) => {
  router.push(`/projects/${projectId}/requirements/${id}`)
}

const handleEdit = (id: string) => {
  router.push(`/projects/${projectId}/requirements/${id}/edit`)
}

const handleDelete = async (id: string) => {
  console.log('Delete requirement:', id)
}

watch(() => store.searchQuery, () => {
  handleSearch()
}, { debounce: 300 } as any)

onMounted(() => {
  store.fetchRequirements(projectId)
})
</script>

<template>
  <div class="h-full">
    <div class="max-w-7xl mx-auto px-6 py-8">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 tracking-tight">
            需求列表
          </h1>
          <p class="text-slate-500 mt-1">
            共 {{ store.pagination.total }} 个需求
          </p>
        </div>
        <Button class="gap-2" @click="router.push(`/projects/${projectId}/requirements/create`)">
          <Plus class="w-4 h-4" />
          新建需求
        </Button>
      </div>

      <Card class="mb-6 border-slate-200/60 shadow-sm">
        <CardHeader class="pb-3">
          <div class="flex items-center gap-2">
            <ListFilter class="w-4 h-4 text-slate-500" />
            <CardTitle class="text-base font-medium">筛选与搜索</CardTitle>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <RequirementSearch
            v-model="store.searchQuery"
            @search="handleSearch"
          />
          <Separator />
          <RequirementFilters
            :filters="store.filters"
            @update:filters="handleFiltersChange"
            @clear="handleClearFilters"
          />
        </CardContent>
      </Card>

      <RequirementTable
        :requirements="store.requirements"
        :loading="store.isLoading"
        :page="store.pagination.page"
        :total-pages="store.totalPages"
        :total="store.pagination.total"
        :page-size="store.pagination.limit"
        @view="handleView"
        @edit="handleEdit"
        @delete="handleDelete"
        @update:page="handlePageChange"
      />
    </div>
  </div>
</template>
