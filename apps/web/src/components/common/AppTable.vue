<script setup lang="ts">
import { computed } from 'vue';

export interface TableColumn {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  fixed?: 'left' | 'right' | boolean;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  slot?: string;
  formatter?: (row: any, column: any, cellValue: any) => string;
}

const props = defineProps<{
  data: any[];
  columns: TableColumn[];
  loading?: boolean;
  stripe?: boolean;
  border?: boolean;
  highlightCurrentRow?: boolean;
  showOverflowTooltip?: boolean;
  height?: number | string;
  maxHeight?: number | string;
}>();

const emit = defineEmits<{
  'row-click': [row: any, column: any, event: MouseEvent];
  'selection-change': [selection: any[]];
}>();

const tableData = computed(() => props.data || []);
</script>

<template>
  <div class="app-table">
    <el-table
      :data="tableData"
      :loading="loading"
      :stripe="stripe ?? true"
      :border="border ?? true"
      :highlight-current-row="highlightCurrentRow ?? false"
      :show-overflow-tooltip="showOverflowTooltip ?? true"
      :height="height"
      :max-height="maxHeight"
      class="app-table-inner"
      @row-click="(row: any, column: any, event: MouseEvent) => emit('row-click', row, column, event)"
      @selection-change="emit('selection-change', $event)"
    >
      <el-table-column
        v-for="col in columns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth"
        :fixed="col.fixed"
        :align="col.align || 'left'"
        :sortable="col.sortable ? 'custom' : false"
      >
        <template v-if="col.slot" #default="{ row }">
          <slot :name="col.slot" :row="row" />
        </template>
        <template v-else-if="col.formatter" #default="{ row }">
          {{ col.formatter?.(row, {}, row[col.prop]) }}
        </template>
      </el-table-column>
    </el-table>
    <slot name="pagination" />
  </div>
</template>

<style scoped>
.app-table {
  width: 100%;
}

.app-table-inner {
  border-radius: 8px;
}
</style>
