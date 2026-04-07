import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/auth/LoginView.vue')
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/auth/RegisterView.vue')
    },
    {
      path: '/',
      component: () => import('@/components/layout/AppLayout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/DashboardView.vue')
        },
        {
          path: 'transactions',
          name: 'Transactions',
          component: () => import('@/views/transactions/TransactionsView.vue')
        },
        {
          path: 'accounts',
          name: 'Accounts',
          component: () => import('@/views/accounts/AccountsView.vue')
        },
        {
          path: 'budgets',
          name: 'Budgets',
          component: () => import('@/views/budgets/BudgetsView.vue')
        },
        {
          path: 'goals',
          name: 'Goals',
          component: () => import('@/views/goals/GoalsView.vue')
        },
        {
          path: 'reports',
          name: 'Reports',
          component: () => import('@/views/reports/ReportsView.vue')
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/settings/SettingsView.vue')
        }
      ]
    }
  ]
})

export default router