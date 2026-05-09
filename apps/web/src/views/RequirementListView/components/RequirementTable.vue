<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,

} from '@/components/ui/pagination'
import type { RequirementResponseDto } from '@req2task/dto'
import EnumBadge from '@/components/common/EnumBadge.vue'
import { REQUIREMENT_STATUS_CONFIG, PRIORITY_CONFIG } from '@/utils/enum-config'

const props = defineProps<{
  requirements: RequirementResponseDto[]
  loading: boolean
  page: number
  totalPages: number
  total: number
  pageSize: number
}>()

const emit = defineEmits<{
  view: [id: string]
  edit: [id: string]
  delete: [id: string]
  'update:page': [page: number]
}>()

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const pageNumbers = computed(() => {
  const pages: (number | 'ellipsis')[] = []
  const total = props.totalPages
  const current = props.page

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('ellipsis')
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < total - 2) pages.push('ellipsis')
    pages.push(total)
  }

  return pages
})
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[280px]">
              <Button variant="ghost" size="sm" class="gap-1 -ml-3">
                需求标题
                <ArrowUpDown class="w-4 h-4" />
              </Button>
            </TableHead>
            <TableHead>关联模块</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>优先级</TableHead>
            <TableHead>故事点</TableHead>
            <TableHead>创建者</TableHead>
            <TableHead>更新时间</TableHead>
            <TableHead class="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell colspan="8" class="text-center py-8 text-slate-500">
              加载中...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="requirements.length === 0">
            <TableCell colspan="8" class="text-center py-8 text-slate-500">
              暂无数据
            </TableCell>
          </TableRow>
          <TableRow v-for="req in requirements" :key="req.id">
            <TableCell class="font-medium">
              <div class="max-w-[260px] truncate" :title="req.title">
                {{ req.title }}
              </div>
            </TableCell>
            <TableCell>
              <div class="flex flex-wrap gap-1">
                <Badge
                  v-for="module in req.modules?.slice(0, 2)"
                  :key="module.id"
                  variant="outline"
                  class="text-xs"
                >
                  {{ module.name }}
                </Badge>
                <Badge v-if="req.modules && req.modules.length > 2" variant="outline" class="text-xs">
                  +{{ req.modules.length - 2 }}
                </Badge>
                <span v-if="!req.modules || req.modules.length === 0" class="text-slate-400 text-sm">-</span>
              </div>
            </TableCell>
            <TableCell>
              <EnumBadge :value="req.status" :config="REQUIREMENT_STATUS_CONFIG" />
            </TableCell>
            <TableCell>
              <EnumBadge :value="req.priority" :config="PRIORITY_CONFIG" />
            </TableCell>
            <TableCell>{{ req.storyPoints }}</TableCell>
            <TableCell>{{ req.createdBy?.displayName || '-' }}</TableCell>
            <TableCell>{{ formatDate(req.updatedAt) }}</TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon" class="h-8 w-8">
                    <MoreHorizontal class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="emit('view', req.id)">
                    <Eye class="w-4 h-4 mr-2" />
                    查看详情
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="emit('edit', req.id)">
                    <Edit class="w-4 h-4 mr-2" />
                    编辑
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="text-red-600"
                    @click="emit('delete', req.id)"
                  >
                    <Trash2 class="w-4 h-4 mr-2" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Pagination v-if="totalPages > 1" :total="total" :items-per-page="pageSize" :sibling-count="1" :page="page">
      <PaginationContent>
        <PaginationPrev :disabled="page === 1" @click="emit('update:page', page - 1)" />
        <template v-for="(p, index) in pageNumbers" :key="index">
          <PaginationEllipsis v-if="p === 'ellipsis'" />
          <PaginationItem v-else :value="p" @click="emit('update:page', p)">
            <Button
              :variant="p === page ? 'default' : 'ghost'"
              size="sm"
              class="w-9"
            >
              {{ p }}
            </Button>
          </PaginationItem>
        </template>
        <PaginationNext :disabled="page === totalPages" @click="emit('update:page', page + 1)" />
      </PaginationContent>
    </Pagination>
  </div>
</template>
