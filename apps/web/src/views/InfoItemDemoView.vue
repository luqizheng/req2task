<template>
  <div class="demo-container">
    <h1>InfoItem组件演示</h1>
    <InfoItem :items="infoItems" />

    <h1>Card</h1>

    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>需求内容</span>
        </div>
      </template>
      <p>
        作为一个电商平台的用户，我希望能够在移动端浏览和购买商品，系统需要支持商品搜索、筛选、加入购物车及支付功能。同时需要支持多种支付方式，包括微信支付、支付宝、银行卡支付，并提供订单跟踪和售后服务入口。页面需要适配iOS和Android主流机型，保证加载速度在3秒以内。
      </p>
      <template #footer> <InfoItem :items="infoItems" /></template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { InfoItem } from "@/components/common";

const infoItems = [
  { title: "来源", content: "用户访谈" },
  { title: "采集时间", content: "2024-03-15 14:30" },
  { title: "采集类型", content: "访谈记录" },
  { title: "创建时间", content: "2024-03-15 09:00" },
];
</script>

<style scoped>
.demo-container {
  padding: 24px;
}

h1 {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
  color: #333;
}
</style>
