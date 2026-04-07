import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // ПОТОМ поменяешь на реальный порт
  headers: {
    'Content-Type': 'application/json'
  }
})

// Добавляем userId к каждому запросу (когда будет авторизация)
api.interceptors.request.use(config => {
  const userId = localStorage.getItem('userId')
  if (userId) {
    config.headers['X-User-Id'] = userId
  }
  return config
})

export default api