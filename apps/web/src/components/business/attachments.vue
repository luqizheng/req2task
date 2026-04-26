<template>
    <el-card>
        <template #header>
            <div style="display: flex; flex-direction: row; align-items: center">
                <h1 style="flex: 9">附件</h1>
            </div>
            <AppBadge :value="props.attachments.length" type="info" />
        </template>

        
    </el-card>
</template>

<setup setup lang="ts">
import { AttachmentResponseDto } from "@req2task/dto";
const props = defineProps<{
  attachments: AttachmentResponseDto[];
}>();
