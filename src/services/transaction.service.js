import api from './api'
import { mockTransactions } from '@/mocks/transactions.mock'

export const transactionService = {
  // ПОКА возвращаем моковые данные
  async getAll(filters = {}) {
    // Когда будет бэк: return await api.get('/transactions', { params: filters })
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ data: mockTransactions })
      }, 500) // имитация задержки сети
    })
  },
  
  async getById(id) {
    // return await api.get(`/transactions/${id}`)
  },
  
  async create(data) {
    // return await api.post('/transactions', data)
  },
  
  async update(id, data) {
    // return await api.put(`/transactions/${id}`, data)
  },
  
  async delete(id) {
    // return await api.delete(`/transactions/${id}`)
  }
}