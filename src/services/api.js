import axios from 'axios'

const api = axios.create({
  baseURL: 'https://localhost:7016/api', // Порт твоего бэка
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const userId = localStorage.getItem('userId')
  if (userId) {
    config.headers['X-User-Id'] = userId
  }
  return config
})

export default api