import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserInfoDto } from '@req2task/dto';

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('accessToken') || '');
  const userInfo = ref<UserInfoDto | null>(() => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  });

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('accessToken', newToken);
  };

  const setUserInfo = (info: UserInfoDto) => {
    userInfo.value = info;
    localStorage.setItem('user', JSON.stringify(info));
  };

  const logout = () => {
    token.value = '';
    userInfo.value = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  const isLoggedIn = () => !!token.value && !!userInfo.value;

  return {
    token,
    userInfo,
    setToken,
    setUserInfo,
    logout,
    isLoggedIn,
  };
});