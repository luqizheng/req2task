<script setup lang="ts">
import { ref } from "vue";
import { useRequirementCollectStore, type CollectionType } from "../store";
import { showToast } from "@/lib/toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NativeSelect } from "@/components/ui/native-select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon } from "lucide-vue-next";

const store = useRequirementCollectStore();

const formData = ref({
  title: "",
  type: "" as CollectionType | "",
  collectedAt: new Date(),
});

const typeOptions = [
  { value: "meeting", label: "会议" },
  { value: "interview", label: "访谈" },
  { value: "document", label: "文档" },
  { value: "other", label: "其他" },
];

const handleSubmit = () => {
  if (!formData.value.title || !formData.value.type) {
    return;
  }

  store.setCurrentCollection({
    id: crypto.randomUUID(),
    title: formData.value.title,
    type: formData.value.type as CollectionType,
    collectedAt: formData.value.collectedAt,
  });

  showToast.success("需求收集已创建");
};
</script>

<template>
  <Form @submit="handleSubmit" class="space-y-4">
    <FormField name="title">
      <FormItem>
        <FormLabel>收集标题</FormLabel>
        <FormControl>
          <Input
            v-model="formData.title"
            placeholder="输入收集标题"
            required
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="type">
      <FormItem>
        <FormLabel>收集类型</FormLabel>
        <FormControl>
          <Select v-model="formData.type" required>
            <SelectTrigger>
              <SelectValue placeholder="选择收集类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in typeOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField name="collectedAt">
      <FormItem class="flex flex-col">
        <FormLabel>收集时间</FormLabel>
        <Popover>
          <PopoverTrigger as-child>
            <FormControl>
              <Button
                variant="outline"
                :class="
                  cn(
                    'w-full justify-start text-left font-normal',
                    !formData.collectedAt && 'text-muted-foreground'
                  )
                "
              >
                <CalendarIcon class="mr-2 h-4 w-4" />
                {formData.collectedAt
                  ? format(formData.collectedAt, "yyyy年MM月dd日", { locale: zhCN })
                  : "选择日期"}
              </Button>
            </FormControl>
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0" align="start">
            <Calendar
              v-model="formData.collectedAt"
              :locale="zhCN"
              initial-focus
            />
          </PopoverContent>
        </Popover>
        <FormMessage />
      </FormItem>
    </FormField>

    <Button type="submit" class="w-full"> 创建收集 </Button>
  </Form>
</template>
