import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  // Порт твоего бэка: 7016
  const API_URL = 'https://localhost:7016/api/auth'
  
  const userId = ref(localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null)
  const fullName = ref(localStorage.getItem('fullName') || '')
  const router = useRouter()

  const isAuthenticated = computed(() => userId.value !== null)

  async function login(credentials) {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials)
      
      userId.value = response.data.userId
      fullName.value = response.data.fullName
      
      localStorage.setItem('userId', response.data.userId)
      localStorage.setItem('fullName', response.data.fullName)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Ошибка соединения с сервером' 
      }
    }
  }

  async function register(credentials) {
    try {
      const response = await axios.post(`${API_URL}/register`, credentials)
      
      userId.value = response.data.userId
      fullName.value = credentials.fullName
      
      localStorage.setItem('userId', response.data.userId)
      localStorage.setItem('fullName', credentials.fullName)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Ошибка регистрации' 
      }
    }
  }

  function logout() {
    userId.value = null
    fullName.value = ''
    localStorage.removeItem('userId')
    localStorage.removeItem('fullName')
    router.push('/login')
  }

  return { userId, fullName, isAuthenticated, login, register, logout }
})