<template>
  <div class="transactions-page">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="Тип">
          <el-select v-model="filters.type" placeholder="Все типы" clearable style="width: 150px">
            <el-option label="Доходы" value="Income" />
            <el-option label="Расходы" value="Expense" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Категория">
          <el-select v-model="filters.categoryId" placeholder="Все категории" clearable style="width: 200px">
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            >
              <span>{{ cat.icon }} {{ cat.name }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        
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
        
        <el-form-item>
          <el-button type="primary" @click="loadTransactions">
            <el-icon><Search /></el-icon>
            Применить
          </el-button>
        </el-form-item>
        
        <el-form-item style="margin-left: auto">
          <el-button type="success" @click="openAddDialog">
            <el-icon><Plus /></el-icon>
            Добавить транзакцию
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="8">
        <el-card class="stat-card income">
          <div class="stat-label">Доходы за период</div>
          <div class="stat-value">{{ formatCurrency(totalIncome) }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card expense">
          <div class="stat-label">Расходы за период</div>
          <div class="stat-value">{{ formatCurrency(totalExpense) }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="stat-card">
          <div class="stat-label">Общий баланс счетов</div>
          <div class="stat-value" :class="totalAccountsBalance >= 0 ? 'positive' : 'negative'">
            {{ formatCurrency(totalAccountsBalance) }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <el-table :data="transactions" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="date" label="Дата" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        
        <el-table-column label="Категория" width="180">
          <template #default="{ row }">
            <span v-if="row.categoryIcon" style="font-size: 18px">{{ row.categoryIcon }}</span>
            <span style="margin-left: 8px">{{ row.categoryName }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="Описание" min-width="150" />
        
        <el-table-column prop="accountName" label="Счёт" width="150" />
        
        <el-table-column label="Сумма" width="150" align="right">
          <template #default="{ row }">
            <span :class="row.type === 'Income' ? 'text-income' : 'text-expense'">
              {{ row.type === 'Income' ? '+' : '-' }} {{ formatCurrency(row.amount) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column label="Действия" width="150" align="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">
              Изменить
            </el-button>
            <el-button size="small" type="danger" @click="deleteTransaction(row.id)">
              Удалить
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div v-if="transactions.length === 0 && !loading" style="text-align: center; padding: 40px; color: #909399">
        Нет транзакций. Добавьте первую!
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? 'Редактировать транзакцию' : 'Новая транзакция'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="Тип" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio-button label="Expense">Расход</el-radio-button>
            <el-radio-button label="Income">Доход</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="Сумма" prop="amount">
          <el-input-number
            v-model="form.amount"
            :min="0.01"
            :precision="2"
            :step="100"
            style="width: 100%"
            placeholder="0.00"
          />
        </el-form-item>
        
        <el-form-item label="Категория" prop="categoryId">
          <el-select v-model="form.categoryId" placeholder="Выберите категорию" style="width: 100%">
            <el-option
              v-for="cat in filteredCategories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            >
              <span>{{ cat.icon }} {{ cat.name }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="Счёт" prop="accountId">
          <el-select v-model="form.accountId" placeholder="Выберите счёт" style="width: 100%">
            <el-option
              v-for="acc in accounts"
              :key="acc.id"
              :label="acc.name"
              :value="acc.id"
            >
              <span>{{ acc.icon }} {{ acc.name }} ({{ formatCurrency(acc.balance) }})</span>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="Дата" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="Выберите дату"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="Описание">
          <el-input v-model="form.description" placeholder="Например: Продукты" />
        </el-form-item>
        
        <el-form-item label="Заметка">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            placeholder="Дополнительная информация"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEditing ? 'Сохранить' : 'Добавить' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { transactionService } from '@/services/transaction.service'
import { accountService } from '@/services/account.service'
import { categoryService } from '@/services/category.service'
import { budgetService } from '@/services/budget.service'
import { useAuthStore } from '@/stores/auth.store'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const userId = computed(() => authStore.userId)

const transactions = ref([])
const accounts = ref([])
const categories = ref([])
const currentBudgets = ref([])
const loading = ref(false)
const submitting = ref(false)

const filters = reactive({
  type: '',
  categoryId: null
})
const dateRange = ref([])

const dialogVisible = ref(false)
const isEditing = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  type: 'Expense',
  amount: null,
  categoryId: null,
  accountId: null,
  date: new Date(),
  description: '',
  note: ''
})

const rules = {
  type: [{ required: true, message: 'Выберите тип', trigger: 'change' }],
  amount: [{ required: true, message: 'Введите сумму', trigger: 'blur' }],
  categoryId: [{ required: true, message: 'Выберите категорию', trigger: 'change' }],
  accountId: [{ required: true, message: 'Выберите счёт', trigger: 'change' }],
  date: [{ required: true, message: 'Выберите дату', trigger: 'change' }]
}

const filteredCategories = computed(() => {
  if (!form.type) return categories.value
  return categories.value.filter(c => c.type === form.type)
})

const totalIncome = computed(() => {
  return transactions.value
    .filter(t => t.type === 'Income')
    .reduce((sum, t) => sum + t.amount, 0)
})

const totalExpense = computed(() => {
  return transactions.value
    .filter(t => t.type === 'Expense')
    .reduce((sum, t) => sum + t.amount, 0)
})

const totalAccountsBalance = computed(() => {
  return accounts.value.reduce((sum, acc) => sum + acc.balance, 0)
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2
  }).format(value)
}

const formatDate = (date) => {
  return dayjs(date).format('DD.MM.YYYY')
}

const loadTransactions = async () => {
  if (!userId.value) return
  
  loading.value = true
  try {
    const params = {
      userId: userId.value,
      type: filters.type || null,
      categoryId: filters.categoryId || null
    }
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.from = dayjs(dateRange.value[0]).format('YYYY-MM-DD')
      params.to = dayjs(dateRange.value[1]).format('YYYY-MM-DD')
    }
    
    transactions.value = await transactionService.getAll(userId.value, params)
  } catch (error) {
    ElMessage.error('Ошибка загрузки транзакций')
  } finally {
    loading.value = false
  }
}

const loadAccounts = async () => {
  if (!userId.value) return
  try {
    accounts.value = await accountService.getAll(userId.value)
  } catch (error) {
    ElMessage.error('Ошибка загрузки счетов')
  }
}

const loadCategories = async () => {
  if (!userId.value) return
  try {
    categories.value = await categoryService.getAll(userId.value)
  } catch (error) {
    ElMessage.error('Ошибка загрузки категорий')
  }
}

const loadBudgets = async () => {
  if (!userId.value) return
  const now = dayjs()
  try {
    // Получаем бюджеты на ТЕКУЩИЙ месяц
    currentBudgets.value = await budgetService.getBudgets(userId.value, now.month() + 1, now.year())
  } catch (error) {
    console.error('Ошибка загрузки бюджетов', error)
  }
}

const openAddDialog = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (transaction) => {
  isEditing.value = true
  form.id = transaction.id
  form.type = transaction.type
  form.amount = transaction.amount
  form.categoryId = transaction.categoryId
  form.accountId = transaction.accountId
  form.date = new Date(transaction.date)
  form.description = transaction.description || ''
  form.note = transaction.note || ''
  dialogVisible.value = true
}

const resetForm = () => {
  form.id = null
  form.type = 'Expense'
  form.amount = null
  form.categoryId = null
  form.accountId = null
  form.date = new Date()
  form.description = ''
  form.note = ''
}


const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    if (!isEditing.value && form.type === 'Expense') {
      const now = dayjs()
      const transactionDate = dayjs(form.date)
      
      if (transactionDate.month() === now.month() && transactionDate.year() === now.year()) {
        
        const currentBudgets = await budgetService.getBudgets(userId.value, now.month() + 1, now.year())
        
        const budgetItem = currentBudgets.find(b => b.categoryId === form.categoryId)
        
        if (budgetItem && budgetItem.limitAmount > 0) {
          const alreadySpent = budgetItem.spentAmount
          
          console.log('=== ПРОВЕРКА БЮДЖЕТА ===')
          console.log('Категория:', budgetItem.categoryName)
          console.log('Лимит:', budgetItem.limitAmount)
          console.log('Уже потрачено:', alreadySpent)
          console.log('Планируемый расход:', form.amount)
          console.log('Итого будет:', alreadySpent + form.amount)
          console.log('Превышение?', (alreadySpent + form.amount) > budgetItem.limitAmount)
          
          if (alreadySpent + form.amount > budgetItem.limitAmount) {
            try {
              await ElMessageBox.confirm(
                `⚠️ Вы превысите бюджет!\n\n` +
                `Категория: ${budgetItem.categoryName}\n` +
                `Лимит: ${formatCurrency(budgetItem.limitAmount)}\n` +
                `Уже потрачено: ${formatCurrency(alreadySpent)}\n` +
                `Новый расход: ${formatCurrency(form.amount)}\n` +
                `Итого: ${formatCurrency(alreadySpent + form.amount)}\n\n` +
                `Продолжить?`,
                'Превышение бюджета',
                {
                  confirmButtonText: 'Да, провести транзакцию',
                  cancelButtonText: 'Отмена',
                  type: 'warning',
                }
              )
              console.log('Пользователь подтвердил превышение')
            } catch (error) {
              console.log('Пользователь отменил транзакцию')
              return
            }
          } else {
            console.log('Бюджет не превышен, всё ок')
          }
        } else {
          console.log('Бюджет для этой категории не установлен')
        }
      } else {
        console.log('Транзакция не в текущем месяце')
      }
    }
    
    submitting.value = true
    try {
      if (isEditing.value) {
        await transactionService.update(form.id, form, userId.value)
        ElMessage.success('Транзакция обновлена')
      } else {
        await transactionService.create(form, userId.value)
        ElMessage.success('Транзакция добавлена')
      }
      dialogVisible.value = false
      await loadTransactions()
      await loadAccounts()
    } catch (error) {
      const errorMsg = error.response?.data || error.message || 'Ошибка операции'
      ElMessage.error(typeof errorMsg === 'string' ? errorMsg : 'Ошибка создания транзакции')
    } finally {
      submitting.value = false
    }
  })
}


const deleteTransaction = async (id) => {
  try {
    await ElMessageBox.confirm('Удалить транзакцию?', 'Подтверждение', {
      type: 'warning'
    })
    
    await transactionService.delete(id, userId.value)
    ElMessage.success('Транзакция удалена')
    await loadTransactions()
    await loadAccounts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Ошибка удаления')
    }
  }
}

onMounted(async () => {
  await Promise.all([
    loadTransactions(),
    loadAccounts(),
    loadCategories(),
    loadBudgets()
  ])
})
</script>

<style scoped>
.transactions-page {
  padding: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #212529;
}

.stat-card.income .stat-value {
  color: #67c23a;
}

.stat-card.expense .stat-value {
  color: #f56c6c;
}

.stat-value.positive {
  color: #67c23a;
}

.stat-value.negative {
  color: #f56c6c;
}

.text-income {
  color: #67c23a;
  font-weight: 600;
}

.text-expense {
  color: #f56c6c;
  font-weight: 600;
}
</style>