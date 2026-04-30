<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { CreateFeatureModuleDto, UpdateFeatureModuleDto } from '@req2task/dto';
import { useModules } from './useModules';
import { useModuleForm } from './useModuleForm';
import { toast } from 'vue-sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Field,
  FieldLabel,
} from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FolderTree,
  Plus,
  ChevronRight,
  Folder,
  Layers,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-vue-next';

const props = defineProps<{
  projectId: string;
}>();

const router = useRouter();

const {
  modules,
  loading,
  error,
  fetchModules,
  createModule,
  updateModule,
  deleteModule,
  getAllModules,
} = useModules(props.projectId);

const {
  showCreateDialog,
  showEditDialog,
  showDeleteDialog,
  selectedModule,
  submitting,
  formData,
  isCreateValid,
  isEditValid,
  openCreateDialog,
  openEditDialog,
  openDeleteDialog,
  closeCreateDialog,
  closeEditDialog,
  closeDeleteDialog,
} = useModuleForm();

const handleCreate = async () => {
  if (!isCreateValid.value) {
    toast.error('模块名称和模块Key不能为空');
    return;
  }

  try {
    submitting.value = true;
    const createData: CreateFeatureModuleDto = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      moduleKey: formData.moduleKey.trim(),
      parentId: formData.parentId || undefined,
      projectId: props.projectId,
    };
    await createModule(createData);
    closeCreateDialog();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '创建模块失败');
  } finally {
    submitting.value = false;
  }
};

const handleUpdate = async () => {
  if (!selectedModule.value) return;
  if (!isEditValid.value) {
    toast.error('模块名称不能为空');
    return;
  }

  try {
    submitting.value = true;
    const updateData: UpdateFeatureModuleDto = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      parentId: formData.parentId || undefined,
    };
    await updateModule(selectedModule.value.id, updateData);
    closeEditDialog();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '更新模块失败');
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async () => {
  if (!selectedModule.value) return;

  try {
    submitting.value = true;
    await deleteModule(selectedModule.value.id);
    closeDeleteDialog();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : '删除模块失败');
  } finally {
    submitting.value = false;
  }
};

const goToModule = (moduleId: string) => {
  router.push(`/projects/${props.projectId}/modules/${moduleId}`);
};

const availableParents = () => {
  return getAllModules(modules.value).filter(m => m.id !== selectedModule.value?.id);
};

onMounted(() => {
  fetchModules();
});
</script>

<template>
  <Card class="border-slate-200 shadow-sm overflow-hidden">
    <CardHeader class="pb-4 border-b border-slate-100 bg-slate-50/50">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Layers class="w-4 h-4 text-emerald-600" />
          </div>
          <CardTitle class="text-slate-800">功能模块</CardTitle>
          <span class="ml-1 px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 text-xs">
            {{ modules.length }}
          </span>
        </div>
        <Dialog v-model:open="showCreateDialog">
          <DialogTrigger as-child>
            <Button size="sm" class="shadow-sm" @click="openCreateDialog">
              <Plus class="w-4 h-4 mr-2" />
              新建模块
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>新建模块</DialogTitle>
              <DialogDescription>创建一个新的功能模块</DialogDescription>
            </DialogHeader>
            <div class="space-y-4 py-4">
              <Field>
                <FieldLabel for="name">模块名称 <span class="text-red-500">*</span></FieldLabel>
                <Input
                  id="name"
                  v-model="formData.name"
                  placeholder="请输入模块名称"
                />
              </Field>
              <Field>
                <FieldLabel for="moduleKey">模块 Key <span class="text-red-500">*</span></FieldLabel>
                <Input
                  id="moduleKey"
                  v-model="formData.moduleKey"
                  placeholder="如: user-management"
                />
              </Field>
              <Field>
                <FieldLabel for="description">描述</FieldLabel>
                <Textarea
                  id="description"
                  v-model="formData.description"
                  placeholder="请输入模块描述（可选）"
                  rows="3"
                />
              </Field>
              <Field>
                <FieldLabel for="parent">父模块</FieldLabel>
                <Select v-model="formData.parentId">
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="无（顶级模块）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无（顶级模块）</SelectItem>
                    <SelectItem
                      v-for="m in getAllModules(modules)"
                      :key="m.id"
                      :value="m.id"
                    >
                      {{ m.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" @click="closeCreateDialog">取消</Button>
              <Button :disabled="submitting" @click="handleCreate">
                <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CardHeader>
    <CardContent class="p-6">
      <div v-if="loading" class="space-y-3">
        <Skeleton class="h-14 w-full rounded-lg" />
        <Skeleton class="h-14 w-full rounded-lg" />
        <Skeleton class="h-14 w-full rounded-lg" />
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center py-12 text-center">
        <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
          <FolderTree class="w-6 h-6 text-red-400" />
        </div>
        <p class="text-sm text-red-600">{{ error }}</p>
      </div>

      <div
        v-else-if="modules.length === 0"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Folder class="w-8 h-8 text-slate-400" />
        </div>
        <h3 class="text-sm font-medium text-slate-700 mb-1">暂无功能模块</h3>
        <p class="text-xs text-slate-400 mb-4">点击下方按钮创建第一个模块</p>
        <Button variant="outline" size="sm" @click="openCreateDialog">
          <Plus class="w-4 h-4 mr-2" />
          创建模块
        </Button>
      </div>

      <div v-else class="space-y-2">
        <div
          v-for="module in modules"
          :key="module.id"
          class="group flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-emerald-200 hover:bg-emerald-50/30 cursor-pointer transition-all duration-200"
        >
          <div class="flex items-center gap-4 flex-1" @click="goToModule(module.id)">
            <div class="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
              <FolderTree class="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div>
              <p class="font-medium text-slate-800 group-hover:text-slate-900 transition-colors">
                {{ module.name }}
              </p>
              <p class="text-xs text-slate-400 font-mono">{{ module.moduleKey }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span
              v-if="module.children?.length"
              class="text-xs text-slate-400 bg-slate-100 group-hover:bg-emerald-100 px-2 py-1 rounded transition-colors"
            >
              {{ module.children.length }} 个子模块
            </span>
            <Button
              variant="ghost"
              size="sm"
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="openEditDialog(module)"
            >
              <Edit class="w-4 h-4" />
            </Button>
            <AlertDialog v-model:open="showDeleteDialog">
              <AlertDialogTrigger as-child>
                <Button
                  variant="ghost"
                  size="sm"
                  class="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50"
                  @click.stop="openDeleteDialog(module)"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent @click.stop>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认删除</AlertDialogTitle>
                  <AlertDialogDescription>
                    确定要删除模块 "<strong>{{ selectedModule?.name }}</strong>" 吗？
                    此操作无法撤销。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel @click.stop="closeDeleteDialog">取消</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" :disabled="submitting" @click="handleDelete">
                    <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
                    删除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <ChevronRight class="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>

  <Dialog v-model:open="showEditDialog">
    <DialogContent class="sm:max-w-[480px]" @click.stop>
      <DialogHeader>
        <DialogTitle>编辑模块</DialogTitle>
        <DialogDescription>修改模块信息</DialogDescription>
      </DialogHeader>
      <div class="space-y-4 py-4" @click.stop>
        <Field>
          <FieldLabel for="edit-name">模块名称 <span class="text-red-500">*</span></FieldLabel>
          <Input id="edit-name" v-model="formData.name" placeholder="请输入模块名称" />
        </Field>
        <Field>
          <FieldLabel for="edit-moduleKey">模块 Key</FieldLabel>
          <Input id="edit-moduleKey" v-model="formData.moduleKey" disabled />
        </Field>
        <Field>
          <FieldLabel for="edit-description">描述</FieldLabel>
          <Textarea
            id="edit-description"
            v-model="formData.description"
            placeholder="请输入模块描述（可选）"
            rows="3"
          />
        </Field>
        <Field>
          <FieldLabel for="edit-parent">父模块</FieldLabel>
          <Select v-model="formData.parentId">
            <SelectTrigger id="edit-parent">
              <SelectValue placeholder="无（顶级模块）" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">无（顶级模块）</SelectItem>
              <SelectItem
                v-for="m in availableParents()"
                :key="m.id"
                :value="m.id"
              >
                {{ m.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="closeEditDialog">取消</Button>
        <Button :disabled="submitting" @click="handleUpdate">
          <Loader2 v-if="submitting" class="w-4 h-4 mr-2 animate-spin" />
          保存
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
