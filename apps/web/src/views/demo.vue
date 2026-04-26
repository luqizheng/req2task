<template>
  <div class="demo-container">
    <header class="header">
      <div class="breadcrumb">
        <span class="breadcrumb-item">需求管理</span>
        <span class="breadcrumb-separator">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke="#B0B0B0" stroke-width="1.167" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="breadcrumb-item active">需求详情</span>
      </div>
      <div class="header-right">
        <button class="export-btn">
          <span class="export-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 1.75V12.25" stroke="#7A7A7A" stroke-width="1.167" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12.25 7H1.75" stroke="#7A7A7A" stroke-width="1.167" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M10.5 4.917L7 8.417L3.5 4.917" stroke="#7A7A7A" stroke-width="1.167" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="btn-text">导出</span>
        </button>
        <button class="convert-btn">
          <span class="convert-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="3.5" cy="10.5" r="1.75" stroke="white" stroke-width="1.167" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="10.5" cy="3.5" r="1.75" stroke="white" stroke-width="1.167" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M3.5 10.5L10.5 3.5" stroke="white" stroke-width="1.167" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="btn-text">需求转任务</span>
        </button>
      </div>
    </header>
    <main class="main-area">
      <div class="left-column">
        <!-- 左侧内容区域 -->
      </div>
      <div class="right-column">
        <div class="actions-card">
          <!-- 操作卡片内容 -->
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.demo-container {
  width: 1200px;
  height: 960px;
  background-color: #FFFFFF;
  display: flex;
  flex-direction: column;
}

.header {
  height: 56px;
  background-color: #FFFFFF;
  border-bottom: 1px solid #E8E8E8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-item {
  font-family: 'Inter';
  font-size: 13px;
  color: #7A7A7A;
  font-weight: 400;
}

.breadcrumb-item.active {
  color: #0D0D0D;
  font-weight: 500;
}

.breadcrumb-separator {
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-btn {
  height: 32px;
  padding: 0 14px;
  background-color: #FFFFFF;
  border: 1px solid #E8E8E8;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.export-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.convert-btn {
  height: 32px;
  padding: 0 16px;
  background-color: #0D0D0D;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.btn-text {
  font-family: 'Inter';
  font-size: 13px;
  font-weight: 500;
  color: #FFFFFF;
}

.export-btn .btn-text {
  color: #7A7A7A;
  font-weight: 400;
}

.main-area {
  flex: 1;
  background-color: #FAFAFA;
  display: flex;
  padding: 32px;
  gap: 24px;
}

.left-column {
  flex: 1;
  background-color: #FFFFFF;
  border-radius: 8px;
}

.right-column {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.actions-card {
  background-color: #FFFFFF;
  border: 1px solid #E8E8E8;
  border-radius: 8px;
  padding: 24px;
}
</style>