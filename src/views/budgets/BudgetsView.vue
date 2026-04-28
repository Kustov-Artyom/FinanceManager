<template>
  <div class="budgets-page">
    <!-- Шапка -->
    <div class="page-header">
      <h2>Бюджеты на месяц</h2>
      <el-date-picker
        v-model="currentDate"
        type="month"
        placeholder="Выберите месяц"
        format="MMMM YYYY"
        value-format="YYYY-MM"
        @change="loadBudgets"
      />
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-label">Всего запланировано</div>
          <div class="stat-value">{{ formatCurrency(totalLimit) }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card expense">
          <div class="stat-label">Всего потрачено</div>
          <div class="stat-value">{{ formatCurrency(totalSpent) }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card" :class="{ 'warning-card': totalSpent > totalLimit }">
          <div class="stat-label">Остаток бюджета</div>
          <div class="stat-value">{{ formatCurrency(totalLimit - totalSpent) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card>
      <div v-if="budgets.length === 0" class="empty-state">
        <el-empty description="Нет категорий расходов" />
      </div>

      <div v-for="item in budgets" :key="item.categoryId" class="budget-item">
        <div class="budget-header">
          <div class="category-info">
            <div class="icon-box" :style="{ background: item.categoryColor }">
              {{ item.categoryIcon }}
            </div>
            <div class="text">
              <span class="name">{{ item.categoryName }}</span>
              <span class="numbers">
                Потрачено: <strong>{{ formatCurrency(item.spentAmount) }}</strong>
                <span v-if="item.limitAmount > 0"> из {{ formatCurrency(item.limitAmount) }}</span>
              </span>
            </div>
          </div>
          <div class="actions">
            <el-button 
              size="small" 
              :type="item.limitAmount > 0 ? 'primary' : 'success'" 
              @click="openEditDialog(item)"
            >
              {{ item.limitAmount > 0 ? 'Изменить лимит' : 'Установить лимит' }}
            </el-button>
          </div>
        </div>
        
        <el-progress 
          v-if="item.limitAmount > 0"
          :percentage="calculatePercent(item.spentAmount, item.limitAmount)" 
          :status="getStatus(item.spentAmount, item.limitAmount)"
          :stroke-width="12"
        />
        <div v-else class="no-budget-hint">
          Лимит не установлен
        </div>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="Установить лимит" width="400px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="Категория">
          <span style="font-weight: bold">{{ editingCategoryName }}</span>
        </el-form-item>
        <el-form-item label="Лимит">
          <el-input-number 
            v-model="form.limitAmount" 
            :min="0" 
            :step="1000" 
            style="width: 100%"
            placeholder="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="saveBudget" :loading="loading">Сохранить</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { budgetService } from '@/services/budget.service'
import { useAuthStore } from '@/stores/auth.store'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const userId = computed(() => authStore.userId)

const currentDate = ref(dayjs().format('YYYY-MM'))
const budgets = ref([])
const dialogVisible = ref(false)
const loading = ref(false)

const form = ref({
  categoryId: null,
  limitAmount: 0
})

const editingCategoryName = ref('')

const totalLimit = computed(() => budgets.value.reduce((sum, b) => sum + (b.limitAmount || 0), 0))
const totalSpent = computed(() => budgets.value.reduce((sum, b) => sum + b.spentAmount, 0))

const formatCurrency = (v) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(v)

const calculatePercent = (spent, limit) => {
  if (!limit || limit === 0) return 0
  return Math.min(Math.round((spent / limit) * 100), 100)
}

const getStatus = (spent, limit) => {
  if (!limit || limit === 0) return 'success'
  if (spent > limit) return 'exception'
  if (spent > limit * 0.8) return 'warning'
  return 'success'
}

const loadBudgets = async () => {
  if (!userId.value) return
  const date = dayjs(currentDate.value)
  try {
    budgets.value = await budgetService.getBudgets(userId.value, date.month() + 1, date.year())
  } catch (e) {
    ElMessage.error('Ошибка загрузки бюджетов')
  }
}

const openEditDialog = (item) => {
  form.value.categoryId = item.categoryId
  form.value.limitAmount = item.limitAmount || 0
  editingCategoryName.value = item.categoryName
  dialogVisible.value = true
}

const saveBudget = async () => {
  if (form.value.limitAmount <= 0) {
    ElMessage.warning('Лимит должен быть больше 0')
    return
  }
  
  loading.value = true
  const date = dayjs(currentDate.value)
  try {
    await budgetService.createOrUpdate({
      categoryId: form.value.categoryId,
      limitAmount: form.value.limitAmount,
      month: date.month() + 1,
      year: date.year()
    }, userId.value)
    
    ElMessage.success('Бюджет установлен')
    dialogVisible.value = false
    await loadBudgets()
  } catch (e) {
    ElMessage.error('Ошибка сохранения')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBudgets()
})
</script>

<style scoped>
.budgets-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.stat-card { text-align: center; padding: 20px; }
.stat-label { color: #606266; font-size: 14px; margin-bottom: 8px; }
.stat-value { font-size: 24px; font-weight: 600; }
.stat-card.expense .stat-value { color: #f56c6c; }
.stat-card.warning-card .stat-value { color: #e6a23c; }

.budget-item { padding: 20px 0; border-bottom: 1px solid #f0f0f0; }
.budget-item:last-child { border-bottom: none; }

.budget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.category-info { display: flex; align-items: center; gap: 12px; }
.icon-box { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; color: white; }
.name { display: block; font-weight: 600; font-size: 16px; color: #303133; }
.numbers { display: block; color: #909399; font-size: 13px; margin-top: 4px; }

.no-budget-hint {
  color: #c0c4cc;
  font-size: 13px;
  font-style: italic;
}

.empty-state { padding: 40px; text-align: center; }
</style>