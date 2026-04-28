<template>
  <div class="dashboard-page">
    <el-row :gutter="20" style="margin-bottom: 24px">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-label">Общий баланс</div>
            <div class="stat-value">{{ formatCurrency(stats.totalBalance) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card income">
          <div class="stat-content">
            <div class="stat-label">Доход за месяц</div>
            <div class="stat-value">{{ formatCurrency(stats.monthlyIncome) }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card expense">
          <div class="stat-content">
            <div class="stat-label">Расход за месяц</div>
            <div class="stat-value">{{ formatCurrency(stats.monthlyExpense) }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 24px">
      <el-col :xs="24" :md="12">
        <el-card class="chart-card">
          <template #header><span>Расходы по категориям</span></template>
          <div class="chart-wrapper">
            <Pie v-if="stats.expenseCategories.length" :data="expensePieData" :options="pieOptions" />
            <el-empty v-else description="Нет расходов" :image-size="80" />
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="12">
        <el-card class="chart-card">
          <template #header><span>Доходы по категориям</span></template>
          <div class="chart-wrapper">
            <Pie v-if="stats.incomeCategories.length" :data="incomePieData" :options="pieOptions" />
            <el-empty v-else description="Нет доходов" :image-size="80" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="chart-card large-chart" style="margin-bottom: 24px">
      <template #header><span>Динамика: Доходы vs Расходы (6 мес)</span></template>
      <div class="chart-wrapper">
        <Line v-if="lineChartData" :data="lineChartData" :options="lineOptions" />
      </div>
    </el-card>

    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between;">
          <span>Последние операции</span>
          <el-button type="primary" link @click="$router.push('/transactions')">Все</el-button>
        </div>
      </template>
      <el-table :data="recentTransactions" stripe style="width: 100%">
        <el-table-column label="Категория" width="160">
          <template #default="{ row }">
            <el-tag effect="plain" :color="row.categoryColor + '20'">{{ row.categoryIcon }} {{ row.categoryName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="Описание" />
        <el-table-column prop="accountName" label="Счёт" width="130" />
        <el-table-column label="Сумма" width="140" align="right">
          <template #default="{ row }">
            <span :class="row.type === 'Income' ? 'text-income' : 'text-expense'">
              {{ row.type === 'Income' ? '+' : '-' }} {{ formatCurrency(row.amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Дата" width="120" align="right">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Pie, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { useAuthStore } from '@/stores/auth.store'
import { transactionService } from '@/services/transaction.service'
import api from '@/services/api'
import dayjs from 'dayjs'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Filler)

const authStore = useAuthStore()
const userId = computed(() => authStore.userId)

const stats = ref({
  totalBalance: 0, monthlyIncome: 0, monthlyExpense: 0,
  expenseCategories: [], incomeCategories: [], monthlyStats: []
})
const recentTransactions = ref([])

const expensePieData = computed(() => ({
  labels: stats.value.expenseCategories.map(c => c.name),
  datasets: [{ data: stats.value.expenseCategories.map(c => c.amount), backgroundColor: stats.value.expenseCategories.map(c => c.color) }]
}))

const incomePieData = computed(() => ({
  labels: stats.value.incomeCategories.map(c => c.name),
  datasets: [{ data: stats.value.incomeCategories.map(c => c.amount), backgroundColor: stats.value.incomeCategories.map(c => c.color) }]
}))

const lineChartData = computed(() => {
  if (!stats.value.monthlyStats.length) return null
  return {
    labels: stats.value.monthlyStats.map(m => m.monthName),
    datasets: [
      { label: 'Доходы', data: stats.value.monthlyStats.map(m => m.income), borderColor: '#67c23a', backgroundColor: 'rgba(103, 194, 58, 0.1)', fill: true, tension: 0.4 },
      { label: 'Расходы', data: stats.value.monthlyStats.map(m => m.expense), borderColor: '#f56c6c', backgroundColor: 'rgba(245, 108, 108, 0.1)', fill: true, tension: 0.4 }
    ]
  }
})

const pieOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
const lineOptions = { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } }

const formatCurrency = (v) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(v)
const formatDate = (date) => dayjs(date).format('DD.MM.YYYY')

const load = async () => {
  if (!userId.value) return
  try {
    const [statsRes, transRes] = await Promise.all([
      api.get(`/dashboard/stats?userId=${userId.value}`),
      transactionService.getAll(userId.value)
    ])
    stats.value = statsRes.data
    recentTransactions.value = transRes.slice(0, 5)
  } catch (e) { console.error(e) }
}

onMounted(load)
</script>

<style scoped>
.dashboard-page { padding: 20px; }
.stat-card { text-align: center; padding: 20px; }
.stat-label { color: #606266; font-size: 14px; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 600; }
.stat-card.income .stat-value { color: #67c23a; }
.stat-card.expense .stat-value { color: #f56c6c; }
.chart-card { height: 320px; display: flex; flex-direction: column; }
.large-chart { height: 400px; }
.chart-wrapper { flex: 1; position: relative; min-height: 0; }
.text-income { color: #67c23a; font-weight: bold; }
.text-expense { color: #f56c6c; font-weight: bold; }
</style>