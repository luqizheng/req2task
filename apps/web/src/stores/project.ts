import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  ProjectResponseDto,
  CreateProjectDto,
  UpdateProjectDto,
  AddMemberDto,
} from '@req2task/dto';
import { projectsApi } from '@/api/projects';
import type { ProjectListParams } from '@/api/projects';

export const useProjectStore = defineStore('project', () => {
  const projectList = ref<ProjectResponseDto[]>([]);
  const currentProject = ref<ProjectResponseDto | null>(null);
  const loading = ref(false);
  const total = ref(0);

  const fetchProjectList = async (params: ProjectListParams = {}) => {
    loading.value = true;
    try {
      const { data } = await projectsApi.getList(params);
      projectList.value = data.items;
      total.value = data.total;
    } finally {
      loading.value = false;
    }
  };

  const fetchProjectById = async (id: string) => {
    loading.value = true;
    try {
      const { data } = await projectsApi.getById(id);
      currentProject.value = data;
    } finally {
      loading.value = false;
    }
  };

  const createProject = async (data: CreateProjectDto) => {
    loading.value = true;
    try {
      const { data: result } = await projectsApi.create(data);
      return result;
    } finally {
      loading.value = false;
    }
  };

  const updateProject = async (id: string, data: UpdateProjectDto) => {
    loading.value = true;
    try {
      const { data: result } = await projectsApi.update(id, data);
      currentProject.value = result;
    } finally {
      loading.value = false;
    }
  };

  const deleteProject = async (id: string) => {
    loading.value = true;
    try {
      await projectsApi.delete(id);
    } finally {
      loading.value = false;
    }
  };

  const addMember = async (projectId: string, data: AddMemberDto) => {
    loading.value = true;
    try {
      const { data: result } = await projectsApi.addMember(projectId, data);
      currentProject.value = result;
    } finally {
      loading.value = false;
    }
  };

  const removeMember = async (projectId: string, userId: string) => {
    loading.value = true;
    try {
      const { data: result } = await projectsApi.removeMember(projectId, userId);
      currentProject.value = result;
    } finally {
      loading.value = false;
    }
  };

  return {
    projectList,
    currentProject,
    loading,
    total,
    fetchProjectList,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
  };
});
