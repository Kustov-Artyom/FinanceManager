import api from './api'

export const accountService = {
  async getAll(userId) {
    const response = await api.get('/accounts', { params: { userId } })
    return response.data
  },
  
  async getById(id, userId) {
    const response = await api.get(`/accounts/${id}`, { params: { userId } })
    return response.data
  },
  
  async create(accountData, userId) {
    // Отправляем userId в теле запроса вместе с данными счёта
    const requestData = {
      ...accountData,
      userId: userId
    }
    const response = await api.post('/accounts', requestData)
    return response.data
  },
  
  async update(id, accountData, userId) {
    const requestData = {
      ...accountData,
      userId: userId
    }
    await api.put(`/accounts/${id}`, requestData)
  },
  
  async delete(id, userId) {
    await api.delete(`/accounts/${id}`, { params: { userId } })
  }
}