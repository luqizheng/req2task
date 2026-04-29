<script setup lang="ts">
import { useLayout } from '@/composables/useLayout';
import AppSidebar from './AppSidebar.vue';
import AppHeader from './AppHeader.vue';
import UserDropdown from './UserDropdown.vue';
import PasswordDialog from './PasswordDialog.vue';
import AiAssistantButton from './AiAssistantButton.vue';

const {
  isCollapsed,
  passwordDialogVisible,
  passwordFormRef,
  passwordForm,
  passwordRules,
  userDisplayName,
  toggleSidebar,
  openPasswordDialog,
  handleLogout,
  handleChangePassword
} = useLayout();
</script>

<template>
  <div class="layout-container" :class="{ collapsed: isCollapsed }">
    <AppSidebar :is-collapsed="isCollapsed" @toggle="toggleSidebar" />

    <div class="main-wrapper">
      <AppHeader>
        <template #user-area>
          <UserDropdown
            :display-name="userDisplayName"
            @open-password="openPasswordDialog"
            @logout="handleLogout"
          />
        </template>
      </AppHeader>

      <main class="main-content">
        <slot />
      </main>
    </div>

    <AiAssistantButton />

    <PasswordDialog
      v-model:visible="passwordDialogVisible"
      :form-ref="passwordFormRef"
      :form="passwordForm"
      :rules="passwordRules"
      @submit="handleChangePassword"
    />
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  background: #f1f5f9;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  margin: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}
</style>
