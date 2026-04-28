<template>
  <div class="reports-page">
    <div class="page-header">
      <h2>Отчеты и экспорт</h2>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="Период">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="—"
            start-placeholder="Начало"
            end-placeholder="Конец"
            style="width: 250px"
          />
        </el-form-item>
        
        <el-form-item label="Тип">
          <el-select v-model="filters.type" placeholder="Все" clearable style="width: 120px">
            <el-option label="Доходы" value="Income" />
            <el-option label="Расходы" value="Expense" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Категория">
          <el-select v-model="filters.categoryId" placeholder="Все" clearable style="width: 180px">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="downloadReport" :loading="loading" size="large">
            <el-icon style="margin-right: 6px"><Download /></el-icon>
            Скачать CSV
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card style="margin-top: 20px" v-if="previewData.length">
      <template #header>Предпросмотр (первые 5 записей)</template>
      <el-table :data="previewData" stripe style="width: 100%">
        
        <el-table-column label="Дата" width="110">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        
        <el-table-column label="Тип" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'Income' ? 'success' : 'danger'" size="small">
              {{ row.type === 'Income' ? 'Доход' : 'Расход' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="categoryName" label="Категория" />
        <el-table-column prop="accountName" label="Счёт" width="150" />
        
        <el-table-column label="Сумма" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.amount) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <div v-else style="text-align: center; padding: 40px; color: #909399">
      Нет данных для отображения. Выберите фильтры.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { categoryService } from '@/services/category.service'
import { transactionService } from '@/services/transaction.service'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/services/api'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const userId = computed(() => authStore.userId)
const categories = ref([])
const previewData = ref([])
const loading = ref(false)

const dateRange = ref([])
const filters = ref({ type: '', categoryId: null })

const formatCurrency = v => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(v)

const formatDate = (date) => {
  return dayjs(date).format('DD.MM.YYYY')
}

const loadCategories = async () => {
  if (!userId.value) return
  categories.value = await categoryService.getAll(userId.value)
}

const loadPreview = async () => {
  if (!userId.value) return
  const params = { userId: userId.value }
  if (dateRange.value?.length === 2) {
    params.from = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
    params.to = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
  }
  if (filters.value.type) params.type = filters.value.type
  if (filters.value.categoryId) params.categoryId = filters.value.categoryId

  // Загружаем все данные (сервер вернет отсортированные)
  const all = await transactionService.getAll(userId.value, params)
  previewData.value = all.slice(0, 5)
}

const downloadReport = async () => {
  if (!userId.value) return
  loading.value = true

  const params = { userId: userId.value }
  if (dateRange.value?.length === 2) {
    params.from = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
    params.to = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
  }
  if (filters.value.type) params.type = filters.value.type
  if (filters.value.categoryId) params.categoryId = filters.value.categoryId

  try {
    const response = await api.get('/reports/export', {
      params,
      responseType: 'blob' // Важно!
    })

    // Создаем ссылку для скачивания
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Otchet_Finansy_${dayjs().format('DD.MM.YYYY')}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    ElMessage.success('Файл скачан! Откройте в Excel.')
  } catch (error) {
    console.error(error)
    ElMessage.error('Ошибка при формировании отчета')
  } finally {
    loading.value = false
  }
}

watch([dateRange, filters], () => {
  loadPreview()
}, { deep: true })

onMounted(() => {
  loadCategories()
  loadPreview()
})
</script>

<style scoped>
.reports-page { padding: 20px; }
.page-header { margin-bottom: 20px; }
.filter-card { margin-bottom: 20px; }
.filter-form { flex-wrap: wrap; gap: 10px; }
</style>