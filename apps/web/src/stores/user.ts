import { defineStore } from 'pinia';
import { ref } from 'vue';

interface UserInfo {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const getStoredUser = (): UserInfo | null => {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('accessToken') || '');
  const userInfo = ref<UserInfo | null>(getStoredUser());

  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('accessToken', newToken);
  };

  const setUserInfo = (info: UserInfo) => {
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
