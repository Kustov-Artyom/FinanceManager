import api from './api'

const API_URL = '/transactions'

export const transactionService = {
  async getAll(userId, filters = {}) {
    const params = { userId, ...filters }
    const response = await api.get(API_URL, { params })
    return response.data
  },
  
  async getById(id, userId) {
    const response = await api.get(`${API_URL}/${id}`, { params: { userId } })
    return response.data
  },
  
  async create(transactionData, userId) {
    const response = await api.post(API_URL, transactionData, {
      params: { userId }
    })
    return response.data
  },
  
  async update(id, transactionData, userId) {
    const response = await api.put(`${API_URL}/${id}`, transactionData, {
      params: { userId }
    })
    return response.data
  },
  
  async delete(id, userId) {
    const response = await api.delete(`${API_URL}/${id}`, {
      params: { userId }
    })
    return response.data
  }
}