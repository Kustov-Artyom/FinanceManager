<template>
  <header class="app-header">
    <div class="header-left">
      <h2 class="page-title">{{ pageTitle }}</h2>
    </div>

    <div class="header-right">
      <el-dropdown>
        <span class="user-info">
          <span>
            <span class="user-info">
              <el-icon>
                <User />
              </el-icon>
              <span>{{ authStore.fullName || authStore.username }}</span>
            </span>
          </span>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="$router.push('/settings')">
              Профиль
            </el-dropdown-item>
            <el-dropdown-item divided @click="logout">
              Выйти
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageTitle = computed(() => {
  const names = {
    Dashboard: 'Dashboard',
    Transactions: 'Транзакции',
    Accounts: 'Счета',
    Budgets: 'Бюджеты',
    Goals: 'Цели',
    Reports: 'Отчеты',
    Settings: 'Настройки'
  }
  return names[route.name] || 'FinanceTracker'
})

const logout = () => {
  authStore.logout()
}
</script>

<style scoped>
.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #212529;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f5f7fa;
}
</style>