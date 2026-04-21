import api from './api'

export const categoryService = {
  async getAll(userId, type = null) {
    const params = { userId }
    if (type) params.type = type
    const response = await api.get('/categories', { params })
    return response.data
  },
  
  async getById(id, userId) {
    const response = await api.get(`/categories/${id}`, { params: { userId } })
    return response.data
  },
  
  async create(categoryData, userId) {
    const requestData = {
      ...categoryData,
      userId: userId
    }
    const response = await api.post('/categories', requestData)
    return response.data
  },
  
  async update(id, categoryData, userId) {
    const requestData = {
      ...categoryData,
      userId: userId
    }
    await api.put(`/categories/${id}`, requestData)
  },
  
  async delete(id, userId) {
    await api.delete(`/categories/${id}`, { params: { userId } })
  }
}