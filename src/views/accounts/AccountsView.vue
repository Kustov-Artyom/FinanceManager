<template>
  <div class="accounts-page">
    <!-- Заголовок + кнопка добавления -->
    <div class="page-header">
      <h2>Мои счета</h2>
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        Добавить счёт
      </el-button>
    </div>

    <!-- Статистика по счетам -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">Всего счетов</div>
          <div class="stat-value">{{ accounts.length }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card income">
          <div class="stat-label">Общий баланс</div>
          <div class="stat-value">{{ formatCurrency(totalBalance) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">В рублях</div>
          <div class="stat-value">{{ formatCurrency(rubBalance) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-label">В валюте</div>
          <div class="stat-value">{{ formatCurrency(usdBalance) }} / {{ formatCurrency(eurBalance) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Список счетов (карточки) -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :sm="12" :lg="8" v-for="account in accounts" :key="account.id">
        <el-card 
          class="account-card" 
          :style="{ borderLeft: `4px solid ${account.color || '#409eff'}` }"
        >
          <div class="account-header">
            <div class="account-icon" :style="{ background: account.color }">
              {{ account.icon || '💳' }}
            </div>
            <div class="account-actions">
              <el-button size="small" circle @click="openEditDialog(account)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" circle type="danger" @click="deleteAccount(account.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          
          <h3 class="account-name">{{ account.name }}</h3>
          
          <div class="account-details">
            <div class="detail-row">
              <span class="label">Тип:</span>
              <span class="value">{{ getAccountTypeLabel(account.type) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Валюта:</span>
              <span class="value">{{ account.currency }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Баланс:</span>
              <span class="value balance" :class="account.balance >= 0 ? 'positive' : 'negative'">
                {{ formatCurrency(account.balance, account.currency) }}
              </span>
            </div>
          </div>
          
          <div v-if="account.isDefault" class="default-badge">
            <el-tag size="small" type="success">Основной</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Пустое состояние -->
    <div v-if="accounts.length === 0 && !loading" class="empty-state">
      <el-empty description="Нет счетов">
        <el-button type="primary" @click="openAddDialog">Создать первый счёт</el-button>
      </el-empty>
    </div>

    <!-- Диалог добавления/редактирования -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? 'Редактировать счёт' : 'Новый счёт'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="Название" prop="name">
          <el-input v-model="form.name" placeholder="Например: Карта Сбер" />
        </el-form-item>
        
        <el-form-item label="Тип" prop="type">
          <el-select v-model="form.type" placeholder="Выберите тип" style="width: 100%">
            <el-option label="💵 Наличные" value="Cash" />
            <el-option label="💳 Банковская карта" value="BankCard" />
            <el-option label="🏦 Банковский счёт" value="BankAccount" />
            <el-option label="₿ Криптовалюта" value="Crypto" />
            <el-option label="📱 Электронный кошелёк" value="EWallet" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Валюта" prop="currency">
          <el-select v-model="form.currency" placeholder="Выберите валюту" style="width: 100%">
            <el-option label="🇷🇺 RUB" value="RUB" />
            <el-option label="🇺🇸 USD" value="USD" />
            <el-option label="🇪🇺 EUR" value="EUR" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Баланс" prop="balance">
          <el-input-number
            v-model="form.balance"
            :min="-999999999"
            :precision="2"
            :step="100"
            style="width: 100%"
            placeholder="0.00"
          />
        </el-form-item>
        
        <el-form-item label="Иконка">
          <el-input v-model="form.icon" placeholder="Emoji: 💳, 🏦, 💵" maxlength="2" />
        </el-form-item>
        
        <el-form-item label="Цвет">
          <el-color-picker v-model="form.color" show-alpha />
        </el-form-item>
        
        <el-form-item label="Основной">
          <el-switch v-model="form.isDefault" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEditing ? 'Сохранить' : 'Создать' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { accountService } from '@/services/account.service'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const userId = computed(() => authStore.userId)

// Данные
const accounts = ref([])
const loading = ref(false)
const submitting = ref(false)

// Диалог
const dialogVisible = ref(false)
const isEditing = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  name: '',
  type: 'BankCard',
  currency: 'RUB',
  balance: 0,
  icon: '💳',
  color: '#409eff',
  isDefault: false
})

// Валидация
const rules = {
  name: [
    { required: true, message: 'Введите название счёта', trigger: 'blur' },
    { min: 2, max: 50, message: 'От 2 до 50 символов', trigger: 'blur' }
  ],
  type: [{ required: true, message: 'Выберите тип', trigger: 'change' }],
  currency: [{ required: true, message: 'Выберите валюту', trigger: 'change' }],
  balance: [{ required: true, message: 'Введите баланс', trigger: 'blur' }]
}

// Вычисляемые значения
const totalBalance = computed(() => {
  return accounts.value.reduce((sum, acc) => {
    if (acc.currency === 'RUB') return sum + acc.balance
    if (acc.currency === 'USD') return sum + acc.balance * 90 // Примерный курс
    if (acc.currency === 'EUR') return sum + acc.balance * 95
    return sum
  }, 0)
})

const rubBalance = computed(() => {
  return accounts.value
    .filter(a => a.currency === 'RUB')
    .reduce((sum, acc) => sum + acc.balance, 0)
})

const usdBalance = computed(() => {
  return accounts.value
    .filter(a => a.currency === 'USD')
    .reduce((sum, acc) => sum + acc.balance, 0)
})

const eurBalance = computed(() => {
  return accounts.value
    .filter(a => a.currency === 'EUR')
    .reduce((sum, acc) => sum + acc.balance, 0)
})

// Методы
const formatCurrency = (value, currency = 'RUB') => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(value)
}

const getAccountTypeLabel = (type) => {
  const labels = {
    Cash: 'Наличные',
    BankCard: 'Банковская карта',
    BankAccount: 'Банковский счёт',
    Crypto: 'Криптовалюта',
    EWallet: 'Электронный кошелёк'
  }
  return labels[type] || type
}

const loadAccounts = async () => {
  if (!userId.value) return
  
  loading.value = true
  try {
    accounts.value = await accountService.getAll(userId.value)
  } catch (error) {
    ElMessage.error('Ошибка загрузки счетов')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (account) => {
  isEditing.value = true
  form.id = account.id
  form.name = account.name
  form.type = account.type
  form.currency = account.currency
  form.balance = account.balance
  form.icon = account.icon || '💳'
  form.color = account.color || '#409eff'
  form.isDefault = account.isDefault
  dialogVisible.value = true
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.type = 'BankCard'
  form.currency = 'RUB'
  form.balance = 0
  form.icon = '💳'
  form.color = '#409eff'
  form.isDefault = false
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (isEditing.value) {
        await accountService.update(form.id, form, userId.value)
        ElMessage.success('Счёт обновлён')
      } else {
        await accountService.create(form, userId.value)
        ElMessage.success('Счёт создан')
      }
      dialogVisible.value = false
      await loadAccounts()
    } catch (error) {
      ElMessage.error(isEditing.value ? 'Ошибка обновления' : 'Ошибка создания')
    } finally {
      submitting.value = false
    }
  })
}

const deleteAccount = async (id) => {
  try {
    await ElMessageBox.confirm('Удалить счёт? Транзакции останутся.', 'Подтверждение', {
      type: 'warning'
    })
    
    await accountService.delete(id, userId.value)
    ElMessage.success('Счёт удалён')
    await loadAccounts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Ошибка удаления')
    }
  }
}

// Загрузка при монтировании
onMounted(() => {
  loadAccounts()
})
</script>

<style scoped>
.accounts-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #212529;
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
  font-size: 24px;
  font-weight: 600;
  color: #212529;
}

.stat-card.income .stat-value {
  color: #67c23a;
}

.account-card {
  margin-bottom: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.account-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.account-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.account-actions {
  display: flex;
  gap: 8px;
}

.account-name {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #212529;
}

.account-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.detail-row .label {
  color: #606266;
}

.detail-row .value {
  font-weight: 500;
  color: #212529;
}

.detail-row .value.balance.positive {
  color: #67c23a;
}

.detail-row .value.balance.negative {
  color: #f56c6c;
}

.default-badge {
  margin-top: 16px;
  text-align: right;
}

.empty-state {
  margin-top: 40px;
}
</style>