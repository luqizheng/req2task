<script setup lang="ts">
import { ref, computed } from "vue";
import { useRequirementCollectStore } from "../store";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrev,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-vue-next";

const store = useRequirementCollectStore();

const currentPage = ref(1);
const pageSize = ref(10);

const statusConfig = {
  pending: { label: "待处理", class: "bg-slate-100 text-slate-700" },
  processing: { label: "处理中", class: "bg-blue-100 text-blue-700" },
  completed: { label: "已完成", class: "bg-emerald-100 text-emerald-700" },
  clarified: { label: "已澄清", class: "bg-indigo-100 text-indigo-700" },
  converted: { label: "已转换", class: "bg-purple-100 text-purple-700" },
  discarded: { label: "已废弃", class: "bg-red-100 text-red-700" },
  failed: { label: "失败", class: "bg-red-100 text-red-700" },
};

const totalPages = computed(() =>
  Math.ceil(store.rawRequirements.length / pageSize.value)
);

const paginatedRequirements = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return store.rawRequirements.slice(start, start + pageSize.value);
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
};

const handleDelete = (id: string) => {
  store.removeRawRequirement(id);
};
</script>

<template>
  <Card class="h-full">
    <CardHeader>
      <CardTitle class="text-lg flex items-center justify-between">
        <span>需求列表</span>
        <Badge variant="secondary">{{ store.rawRequirements.length }} 条</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <div
        v-if="store.rawRequirements.length === 0"
        class="text-center py-12 text-slate-400"
      >
        暂无需求数据
      </div>

      <template v-else>
        <div class="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-[50%]">内容</TableHead>
                <TableHead class="w-[20%]">状态</TableHead>
                <TableHead class="w-[20%]">来源</TableHead>
                <TableHead class="w-[10%]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="req in paginatedRequirements"
                :key="req.id"
              >
                <TableCell class="font-medium">
                  <div class="line-clamp-2">{{ req.content }}</div>
                </TableCell>
                <TableCell>
                  <Badge :class="statusConfig[req.status]?.class">
                    {{ statusConfig[req.status]?.label || req.status }}
                  </Badge>
                </TableCell>
                <TableCell class="text-slate-500">
                  {{ req.source || "-" }}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="handleDelete(req.id)"
                  >
                    <Trash2 class="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <Pagination
          v-if="totalPages > 1"
          :total="store.rawRequirements.length"
          :items-per-page="pageSize"
          :sibling-count="1"
          show-edges
        >
          <PaginationContent>
            <PaginationPrev
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            />
            <PaginationEllipsis v-if="currentPage > 2" @click="goToPage(currentPage - 2)" />
            <PaginationItem
              v-for="page in Array.from({ length: totalPages }, (_, i) => i + 1).filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
              )"
              :key="page"
              :value="page"
              @click="goToPage(page)"
            >
              <Button
                variant="ghost"
                size="sm"
                :class="{ 'bg-slate-100': currentPage === page }"
              >
                {{ page }}
              </Button>
            </PaginationItem>
            <PaginationEllipsis v-if="currentPage < totalPages - 1" @click="goToPage(currentPage + 2)" />
            <PaginationNext
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            />
          </PaginationContent>
        </Pagination>
      </template>
    </CardContent>
  </Card>
</template>
