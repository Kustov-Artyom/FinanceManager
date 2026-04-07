<template>
  <aside class="sidebar">
    <div class="logo">
      <el-icon :size="28"><Money /></el-icon>
      <span>FinanceTracker</span>
    </div>
    
    <el-menu
      :default-active="activeMenu"
      router
      class="sidebar-menu"
    >
      <el-menu-item index="/dashboard">
        <el-icon><DataAnalysis /></el-icon>
        <span>Dashboard</span>
      </el-menu-item>
      
      <el-sub-menu index="operations">
        <template #title>
          <el-icon><Wallet /></el-icon>
          <span>Операции</span>
        </template>
        <el-menu-item index="/transactions">Транзакции</el-menu-item>
        <el-menu-item index="/accounts">Счета</el-menu-item>
      </el-sub-menu>
      
      <el-sub-menu index="analytics">
        <template #title>
          <el-icon><TrendCharts /></el-icon>
          <span>Аналитика</span>
        </template>
        <el-menu-item index="/budgets">Бюджеты</el-menu-item>
        <el-menu-item index="/goals">Цели</el-menu-item>
        <el-menu-item index="/reports">Отчеты</el-menu-item>
      </el-sub-menu>
      
      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <span>Настройки</span>
      </el-menu-item>
    </el-menu>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid #e4e7ed;
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.sidebar-menu {
  border-right: none;
}
</style>