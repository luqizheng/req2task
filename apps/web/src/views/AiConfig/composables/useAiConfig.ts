import { ref, onMounted } from 'vue'
import { useAiStore } from '@/stores/ai'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import { h, render } from 'vue'

export const useAiConfig = () => {
  const aiStore = useAiStore()
  const loading = ref(false)
  const deletingId = ref<string | null>(null)
  const actionLoadingId = ref<string | null>(null)

  const fetchConfigs = async () => {
    loading.value = true
    try {
      await aiStore.fetchConfigs()
    } finally {
      loading.value = false
    }
  }

  const showConfirmDialog = (
    title: string,
    description: string,
    onConfirm: () => void,
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const container = document.createElement('div')
      document.body.appendChild(container)

      const closeDialog = () => {
        render(null, container)
        document.body.removeChild(container)
      }

      const ConfirmDialog = {
        setup() {
          const open = ref(true)

          const handleConfirm = () => {
            open.value = false
            closeDialog()
            onConfirm()
            resolve(true)
          }

          const handleCancel = () => {
            open.value = false
            closeDialog()
            resolve(false)
          }

          return () =>
            h(
              Dialog,
              {
                open: open.value,
                'onUpdate:open': (val: boolean) => {
                  open.value = val
                  if (!val) {
                    closeDialog()
                    resolve(false)
                  }
                },
              },
              {
                default: () =>
                  h(DialogContent, null, {
                    default: () => [
                      h(
                        DialogHeader,
                        null,
                        {
                          default: () => [
                            h(DialogTitle, null, title),
                            h(DialogDescription, null, description),
                          ],
                        },
                      ),
                      h(
                        DialogFooter,
                        null,
                        {
                          default: () => [
                            h(
                              Button,
                              { variant: 'outline', onClick: handleCancel },
                              () => '取消',
                            ),
                            h(
                              Button,
                              { variant: 'destructive', onClick: handleConfirm },
                              () => '删除',
                            ),
                          ],
                        },
                      ),
                    ],
                  }),
              },
            )
        },
      }

      render(h(ConfirmDialog), container)
    })
  }

  const deleteConfig = async (config: (typeof aiStore.configs)[0]) => {
    const confirmed = await showConfirmDialog(
      '删除确认',
      `确定要删除配置"${config.name}"吗？此操作不可恢复。`,
      async () => {
        try {
          deletingId.value = config.id
          await aiStore.deleteConfig(config.id)
          toast.success('删除成功')
        } catch (error) {
          toast.error((error as Error).message || '删除失败')
        } finally {
          deletingId.value = null
        }
      },
    )
    return confirmed
  }

  const setDefault = async (config: (typeof aiStore.configs)[0]) => {
    try {
      actionLoadingId.value = config.id
      await aiStore.updateConfig(config.id, { isDefault: true })
      await aiStore.fetchConfigs()
      toast.success('已设置为默认配置')
    } catch (error) {
      toast.error((error as Error).message || '设置失败')
    } finally {
      actionLoadingId.value = null
    }
  }

  const setActive = async (config: (typeof aiStore.configs)[0]) => {
    try {
      actionLoadingId.value = config.id
      await aiStore.updateConfig(config.id, { isActive: true })
      await aiStore.fetchConfigs()
      toast.success('已激活配置')
    } catch (error) {
      toast.error((error as Error).message || '激活失败')
    } finally {
      actionLoadingId.value = null
    }
  }

  onMounted(fetchConfigs)

  return {
    loading,
    deletingId,
    actionLoadingId,
    configs: aiStore.configs,
    fetchConfigs,
    deleteConfig,
    setDefault,
    setActive,
  }
}
