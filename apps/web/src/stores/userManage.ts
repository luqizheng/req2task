import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserResponseDto } from '@req2task/dto';
import { useUserStore as useAuthUserStore } from './user';
import { usersApi } from '@/api/users';
import type { UserListParams } from '@/api/users';
import type {
  CreateUserDto,
  UpdateUserDto,
  UpdateMeDto,
  ChangePasswordDto,
} from '@req2task/dto';

export const useUserManageStore = defineStore('userManage', () => {
  const userList = ref<UserResponseDto[]>([]);
  const currentUser = ref<UserResponseDto | null>(null);
  const loading = ref(false);
  const total = ref(0);

  const fetchUserList = async (params: UserListParams = {}) => {
    loading.value = true;
    try {
      const { data } = await usersApi.getList(params);
      userList.value = data.items;
      total.value = data.total;
    } finally {
      loading.value = false;
    }
  };

  const fetchCurrentUser = async () => {
    loading.value = true;
    try {
      const { data } = await usersApi.getMe();
      currentUser.value = data;
      const authStore = useAuthUserStore();
      authStore.setUserInfo(data);
    } finally {
      loading.value = false;
    }
  };

  const createUser = async (data: CreateUserDto) => {
    loading.value = true;
    try {
      await usersApi.create(data);
    } finally {
      loading.value = false;
    }
  };

  const updateUser = async (id: string, data: UpdateUserDto) => {
    loading.value = true;
    try {
      await usersApi.update(id, data);
    } finally {
      loading.value = false;
    }
  };

  const deleteUser = async (id: string) => {
    loading.value = true;
    try {
      await usersApi.delete(id);
    } finally {
      loading.value = false;
    }
  };

  const updateProfile = async (data: UpdateMeDto) => {
    loading.value = true;
    try {
      const { data: result } = await usersApi.updateMe(data);
      currentUser.value = result;
    } finally {
      loading.value = false;
    }
  };

  const changePassword = async (data: ChangePasswordDto) => {
    loading.value = true;
    try {
      await usersApi.changePassword(data);
    } finally {
      loading.value = false;
    }
  };

  return {
    userList,
    currentUser,
    loading,
    total,
    fetchUserList,
    fetchCurrentUser,
    createUser,
    updateUser,
    deleteUser,
    updateProfile,
    changePassword,
  };
});
