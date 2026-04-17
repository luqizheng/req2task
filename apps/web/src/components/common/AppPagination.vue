<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  total: number;
  page?: number;
  limit?: number;
  pageSizes?: number[];
  layout?: string;
  background?: boolean;
  small?: boolean;
}>();

const emit = defineEmits<{
  'update:page': [page: number];
  'update:limit': [limit: number];
  'page-change': [page: number];
  'size-change': [limit: number];
}>();

const currentPage = computed({
  get: () => props.page || 1,
  set: (val) => emit('update:page', val)
});

const currentLimit = computed({
  get: () => props.limit || 20,
  set: (val) => emit('update:limit', val)
});

const handlePageChange = (page: number) => {
  emit('page-change', page);
};

const handleSizeChange = (size: number) => {
  emit('size-change', size);
};
</script>

<template>
  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="currentLimit"
    :total="total"
    :page-sizes="pageSizes || [10, 20, 50, 100]"
    :layout="layout || 'total, sizes, prev, pager, next, jumper'"
    :background="background ?? true"
    :small="small ?? false"
    class="app-pagination"
    @current-change="handlePageChange"
    @size-change="handleSizeChange"
  />
</template>

<style scoped>
.app-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}
</style>
