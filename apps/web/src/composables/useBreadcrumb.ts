import { computed } from 'vue'
import { useRoute, type RouteRecordName } from 'vue-router'

export interface BreadcrumbItem {
  title: string
  path?: string
}

export function useBreadcrumb() {
  const route = useRoute()

  const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const items: BreadcrumbItem[] = []
    const routeName = route.name as RouteRecordName

    switch (routeName) {
      case 'dashboard':
        items.push({ title: '首页' })
        break

      case 'projects':
        items.push({ title: '首页', path: '/dashboard' })
        items.push({ title: '项目列表' })
        break

      case 'project-detail':
        items.push({ title: '首页', path: '/dashboard' })
        items.push({ title: '项目列表', path: '/projects' })
        items.push({ title: '项目详情' })
        break

      case 'requirements':
        items.push({ title: '首页', path: '/dashboard' })
        items.push({ title: '项目列表', path: '/projects' })
        items.push({ title: '需求列表' })
        break

      case 'requirement-detail':
        items.push({ title: '首页', path: '/dashboard' })
        items.push({ title: '项目列表', path: '/projects' })
        items.push({ title: '需求列表', path: `/projects/${route.params.projectId}/requirements` })
        items.push({ title: '需求详情' })
        break

      case 'raw-requirement-detail':
        items.push({ title: '首页', path: '/dashboard' })
        items.push({ title: '项目列表', path: '/projects' })
        items.push({ title: '需求列表', path: `/projects/${route.params.projectId}/requirements` })
        items.push({ title: '原始需求编辑器' })
        break

      case 'settings':
        items.push({ title: '首页', path: '/dashboard' })
        items.push({ title: '设置' })
        break

      case 'aiConfig':
        items.push({ title: '首页', path: '/dashboard' })
        items.push({ title: 'AI 配置' })
        break

      case 'aiConfigTest':
        items.push({ title: '首页', path: '/dashboard' })
        items.push({ title: 'AI 配置', path: '/ai/config' })
        items.push({ title: '配置测试' })
        break

      default:
        break
    }

    return items
  })

  return {
    breadcrumbItems,
  }
}
