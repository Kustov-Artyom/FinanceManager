<template>
  <div class="settings-page">
    <h2>Настройки профиля</h2>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card header="Личные данные">
          <el-form :model="profileForm" label-width="100px">
            <el-form-item label="Имя пользователя">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>
            
            <el-form-item label="Полное имя">
              <el-input v-model="profileForm.fullName" placeholder="Иван Иванов" />
            </el-form-item>
            
            <el-form-item label="Email">
              <el-input v-model="profileForm.email" placeholder="ivan@example.com" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="saveProfile" :loading="profileLoading">
                Сохранить изменения
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card header="Безопасность">
          <el-form :model="passwordForm" label-width="120px" :rules="passwordRules" ref="passFormRef">
            <el-form-item label="Текущий пароль" prop="oldPassword">
              <el-input v-model="passwordForm.oldPassword" type="password" show-password />
            </el-form-item>
            
            <el-form-item label="Новый пароль" prop="newPassword">
              <el-input v-model="passwordForm.newPassword" type="password" show-password />
            </el-form-item>
            
            <el-form-item label="Повторите пароль" prop="confirmPassword">
              <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
            </el-form-item>
            
            <el-form-item>
              <el-button type="warning" @click="changePassword" :loading="passLoading">
                Сменить пароль
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth.store'
import api from '@/services/api'

const authStore = useAuthStore()
const userId = authStore.userId

const profileLoading = ref(false)
const passLoading = ref(false)
const passFormRef = ref(null)

const profileForm = reactive({
  username: '',
  fullName: '',
  email: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validatePass2 = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('Пароли не совпадают'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [{ required: true, message: 'Введите текущий пароль', trigger: 'blur' }],
  newPassword: [
    { required: true, message: 'Введите новый пароль', trigger: 'blur' },
    { min: 4, message: 'Минимум 4 символа', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: 'Подтвердите пароль', trigger: 'blur' },
    { validator: validatePass2, trigger: 'blur' }
  ]
}

const loadProfile = async () => {
  if (!userId) return
  try {
    const res = await api.get(`/users/me?userId=${userId}`)
    profileForm.username = res.data.username
    profileForm.fullName = res.data.fullName
    profileForm.email = res.data.email
  } catch (e) {
    console.error(e)
  }
}

const saveProfile = async () => {
  profileLoading.value = true
  try {
    await api.put(`/users/me`, {
      id: userId,
      fullName: profileForm.fullName,
      email: profileForm.email
    })
    ElMessage.success('Профиль обновлен')
    authStore.fullName = profileForm.fullName
  } catch (e) {
    ElMessage.error('Ошибка обновления')
  } finally {
    profileLoading.value = false
  }
}

const changePassword = async () => {
  if (!passFormRef.value) return
  
  await passFormRef.value.validate(async (valid) => {
    if (!valid) return

    passLoading.value = true
    try {
      await api.put('/users/change-password', {
        userId: userId,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      })
      
      ElMessage.success('Пароль успешно изменен')
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    } catch (e) {
      ElMessage.error(e.response?.data?.message || 'Ошибка смены пароля')
    } finally {
      passLoading.value = false
    }
  })
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.settings-page { padding: 20px; }
h2 { margin-bottom: 24px; }
</style>