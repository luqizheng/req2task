<script setup lang="ts">
import { useRequirementCollectStore } from "./store";
import { showToast } from "@/lib/toast";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import CollectionForm from "./components/CollectionForm.vue";
import RequirementInput from "./components/RequirementInput.vue";
import RequirementList from "./components/RequirementList.vue";
import AnalysisPanel from "./components/AnalysisPanel.vue";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList } from "lucide-vue-next";

const store = useRequirementCollectStore();
</script>

<template>
  <div class="h-full flex">
    <Sidebar side="left" variant="sidebar" class="w-[320px]">
      <SidebarHeader class="border-b px-4 py-3">
        <CardTitle class="flex items-center gap-2 text-lg">
          <ClipboardList class="h-5 w-5" />
          需求收集
        </CardTitle>
      </SidebarHeader>
      <SidebarContent class="p-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">新建收集</CardTitle>
          </CardHeader>
          <CardContent>
            <CollectionForm />
          </CardContent>
        </Card>
      </SidebarContent>
      <SidebarFooter class="border-t px-4 py-3">
        <div class="text-xs text-slate-500">
          当前收集: {{ store.currentCollection?.title || "未创建" }}
        </div>
      </SidebarFooter>
    </Sidebar>

    <div class="flex-1 overflow-hidden">
      <ResizablePanelGroup direction="horizontal" class="h-full">
        <ResizablePanel :default-size="40" :min-size="30">
          <div class="h-full p-4">
            <RequirementInput />
          </div>
        </ResizablePanel>

        <ResizableHandle with-handle />

        <ResizablePanel :default-size="35" :min-size="25">
          <div class="h-full p-4">
            <RequirementList />
          </div>
        </ResizablePanel>

        <ResizableHandle with-handle />

        <ResizablePanel :default-size="25" :min-size="20">
          <div class="h-full p-4">
            <AnalysisPanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  </div>
</template>
