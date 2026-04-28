<template>
  <div class="categories-page">
    <!-- Заголовок + кнопки -->
    <div class="page-header">
      <h2>Категории</h2>
      <div class="header-actions">
        <el-radio-group v-model="activeType" @change="loadCategories" size="small">
          <el-radio-button label="Expense">Расходы</el-radio-button>
          <el-radio-button label="Income">Доходы</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="openAddDialog" style="margin-left: 16px">
          <el-icon><Plus /></el-icon>
          Добавить категорию
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :sm="12" :lg="8" v-for="category in categories" :key="category.id">
        <el-card 
          class="category-card" 
          :style="{ borderLeft: `4px solid ${category.color || '#909399'}` }"
        >
          <div class="category-header">
            <div class="category-icon" :style="{ background: category.color }">
              {{ category.icon || '📁' }}
            </div>
            <div class="category-actions" v-if="!category.isSystem">
              <el-button size="small" circle @click="openEditDialog(category)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" circle type="danger" @click="deleteCategory(category.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-tag v-else size="small" type="info">Системная</el-tag>
          </div>
          
          <h3 class="category-name">{{ category.name }}</h3>
          
          <div class="category-type">
            <el-tag :type="category.type === 'Income' ? 'success' : 'warning'" size="small">
              {{ category.type === 'Income' ? 'Доход' : 'Расход' }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div v-if="categories.length === 0 && !loading" class="empty-state">
      <el-empty :description="`Нет категорий типа '${activeType === 'Income' ? 'Доходы' : 'Расходы'}'`">
        <el-button type="primary" @click="openAddDialog">Создать категорию</el-button>
      </el-empty>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? 'Редактировать категорию' : 'Новая категория'"
      width="450px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="Название" prop="name">
          <el-input v-model="form.name" placeholder="Например: Продукты" />
        </el-form-item>
        
        <el-form-item label="Тип" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio label="Expense">Расход</el-radio>
            <el-radio label="Income">Доход</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="Иконка">
          <el-input v-model="form.icon" placeholder="Emoji: 🍔, 💰, 🚗" maxlength="2" />
          <div class="icon-preview" v-if="form.icon">{{ form.icon }}</div>
        </el-form-item>
        
        <el-form-item label="Цвет">
          <el-color-picker v-model="form.color" show-alpha />
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
import { categoryService } from '@/services/category.service'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
const userId = computed(() => authStore.userId)

const categories = ref([])
const activeType = ref('Expense')
const loading = ref(false)
const submitting = ref(false)

const dialogVisible = ref(false)
const isEditing = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  name: '',
  type: 'Expense',
  icon: '',
  color: '#909399'
})

const rules = {
  name: [
    { required: true, message: 'Введите название', trigger: 'blur' },
    { min: 2, max: 50, message: 'От 2 до 50 символов', trigger: 'blur' }
  ],
  type: [{ required: true, message: 'Выберите тип', trigger: 'change' }]
}

const loadCategories = async () => {
  if (!userId.value) return
  
  loading.value = true
  try {
    categories.value = await categoryService.getAll(userId.value, activeType.value)
  } catch (error) {
    ElMessage.error('Ошибка загрузки категорий')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  isEditing.value = false
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (category) => {
  isEditing.value = true
  form.id = category.id
  form.name = category.name
  form.type = category.type
  form.icon = category.icon || ''
  form.color = category.color || '#909399'
  dialogVisible.value = true
}

const resetForm = () => {
  form.id = null
  form.name = ''
  form.type = activeType.value
  form.icon = ''
  form.color = '#909399'
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    submitting.value = true
    try {
      if (isEditing.value) {
        await categoryService.update(form.id, form, userId.value)
        ElMessage.success('Категория обновлена')
      } else {
        await categoryService.create(form, userId.value)
        ElMessage.success('Категория создана')
      }
      dialogVisible.value = false
      await loadCategories()
    } catch (error) {
      ElMessage.error(isEditing.value ? 'Ошибка обновления' : 'Ошибка создания')
    } finally {
      submitting.value = false
    }
  })
}

const deleteCategory = async (id) => {
  try {
    await ElMessageBox.confirm('Удалить категорию?', 'Подтверждение', { type: 'warning' })
    
    await categoryService.delete(id, userId.value)
    ElMessage.success('Категория удалена')
    await loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Ошибка удаления')
    }
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.categories-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #212529;
}

.header-actions {
  display: flex;
  align-items: center;
}

.category-card {
  margin-bottom: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.category-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.category-actions {
  display: flex;
  gap: 8px;
}

.category-name {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #212529;
}

.category-type {
  display: flex;
  justify-content: flex-end;
}

.icon-preview {
  margin-top: 8px;
  font-size: 32px;
  text-align: center;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 8px;
}

.empty-state {
  margin-top: 40px;
}
</style>