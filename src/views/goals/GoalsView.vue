<template>
  <div class="goals-page">
    <div class="page-header">
      <h2>Финансовые цели</h2>
      <el-button type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> Новая цель
      </el-button>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :lg="8" v-for="goal in goals" :key="goal.id">
        <el-card class="goal-card" :style="{ borderTop: `4px solid ${goal.color}` }">
          <div class="goal-header">
            <div class="icon" :style="{ background: goal.color }">{{ goal.icon }}</div>
            <div class="actions">
              <el-button size="small" circle @click="openTopUpDialog(goal)">💰</el-button>
              <el-button size="small" circle @click="openEditDialog(goal)">✏️</el-button>
              <el-button size="small" circle type="danger" @click="deleteGoal(goal.id)">🗑️</el-button>
            </div>
          </div>

          <h3 class="goal-title">{{ goal.name }}</h3>
          
          <div class="amounts">
            <span class="current">{{ formatCurrency(goal.currentAmount) }}</span>
            <span class="separator">/</span>
            <span class="target">{{ formatCurrency(goal.targetAmount) }}</span>
          </div>

          <el-progress 
            :percentage="Math.min(goal.progressPercent, 100)" 
            :status="getProgressStatus(goal)"
            :stroke-width="10"
            :show-text="false"
            style="margin: 12px 0"
          />

          <div class="meta">
            <el-tag :type="getStatusType(goal.status)" size="small">
              {{ getStatusLabel(goal.status) }}
            </el-tag>
            <span class="deadline">📅 {{ formatDate(goal.deadline) }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div v-if="goals.length === 0" class="empty">
      <el-empty description="Нет целей. Создайте первую!" />
    </div>

    <!-- Модалка Создания/Редактирования -->
    <el-dialog v-model="dialogVisible" :title="isEditing ? 'Изменить цель' : 'Новая цель'" width="450px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="Название">
          <el-input v-model="form.name" placeholder="Например: Отпуск" />
        </el-form-item>
        <el-form-item label="Цель (₽)">
          <el-input-number v-model="form.targetAmount" :min="100" :step="1000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Дедлайн">
          <el-date-picker v-model="form.deadline" type="date" placeholder="Выберите дату" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Иконка">
          <el-input v-model="form.icon" placeholder="🎯, 🚗, " maxlength="2" />
        </el-form-item>
        <el-form-item label="Цвет">
          <el-color-picker v-model="form.color" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="saveGoal" :loading="loading">Сохранить</el-button>
      </template>
    </el-dialog>

    <!-- Модалка Пополнения -->
    <el-dialog v-model="topUpVisible" title="Пополнить цель" width="400px">
      <div style="text-align: center; margin-bottom: 16px">
        <div style="font-size: 40px">{{ editingGoal?.icon }}</div>
        <h3>{{ editingGoal?.name }}</h3>
      </div>
      <el-form-item label="Сумма">
        <el-input-number v-model="topUpAmount" :min="1" :step="100" style="width: 100%" />
      </el-form-item>
      <template #footer>
        <el-button @click="topUpVisible = false">Отмена</el-button>
        <el-button type="success" @click="confirmTopUp" :loading="loading">Пополнить</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { goalService } from '@/services/goal.service'
import { useAuthStore } from '@/stores/auth.store'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const userId = authStore.userId

const goals = ref([])
const dialogVisible = ref(false)
const topUpVisible = ref(false)
const loading = ref(false)
const isEditing = ref(false)
const editingGoal = ref(null)

const form = ref({ name: '', targetAmount: 10000, deadline: new Date(), icon: '🎯', color: '#409eff' })
const topUpAmount = ref(1000)

const formatCurrency = v => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(v)
const formatDate = d => dayjs(d).format('DD.MM.YYYY')

const getProgressStatus = g => g.progressPercent >= 100 ? 'success' : g.progressPercent > 75 ? 'warning' : ''
const getStatusType = s => s === 'completed' ? 'success' : s === 'behind' ? 'danger' : 'primary'
const getStatusLabel = s => s === 'completed' ? 'Выполнено' : s === 'behind' ? 'Просрочено' : 'В процессе'

const loadGoals = async () => {
  if (!userId) return
  goals.value = await goalService.getAll(userId)
}

const openCreateDialog = () => {
  isEditing.value = false
  form.value = { name: '', targetAmount: 10000, deadline: new Date(), icon: '🎯', color: '#409eff' }
  dialogVisible.value = true
}

const openEditDialog = g => {
  isEditing.value = true
  editingGoal.value = g
  form.value = { name: g.name, targetAmount: g.targetAmount, deadline: new Date(g.deadline), icon: g.icon, color: g.color }
  dialogVisible.value = true
}

const saveGoal = async () => {
  if (!form.value.name) return ElMessage.warning('Введите название')
  loading.value = true
  try {
    if (isEditing.value) await goalService.update(editingGoal.value.id, form.value, userId)
    else await goalService.create(form.value, userId)
    ElMessage.success(isEditing.value ? 'Цель обновлена' : 'Цель создана')
    dialogVisible.value = false
    await loadGoals()
  } catch { ElMessage.error('Ошибка сохранения') } 
  finally { loading.value = false }
}

const openTopUpDialog = g => {
  editingGoal.value = g
  topUpAmount.value = 1000
  topUpVisible.value = true
}

const confirmTopUp = async () => {
  if (topUpAmount.value <= 0) return
  loading.value = true
  try {
    await goalService.topUp(editingGoal.value.id, topUpAmount.value, userId)
    ElMessage.success('Цель пополнена')
    topUpVisible.value = false
    await loadGoals()
  } catch { ElMessage.error('Ошибка пополнения') } 
  finally { loading.value = false }
}

const deleteGoal = async id => {
  try {
    await ElMessageBox.confirm('Удалить цель?', 'Подтверждение', { type: 'warning' })
    await goalService.delete(id, userId)
    ElMessage.success('Цель удалена')
    await loadGoals()
  } catch {}
}

onMounted(loadGoals)
</script>

<style scoped>
.goals-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.goal-card { margin-bottom: 20px; transition: transform 0.2s; }
.goal-card:hover { transform: translateY(-4px); }
.goal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #fff; }
.goal-title { margin: 0 0 8px; font-size: 18px; }
.amounts { display: flex; align-items: baseline; gap: 6px; font-size: 16px; }
.current { font-weight: 600; color: #212529; }
.target { color: #909399; }
.separator { color: #dcdfe6; }
.meta { display: flex; justify-content: space-between; align-items: center; }
.deadline { font-size: 13px; color: #909399; }
.empty { padding: 40px; text-align: center; }
</style>