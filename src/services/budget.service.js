import api from './api'

export const budgetService = {
  async getBudgets(userId, month, year) {
    const response = await api.get('/budgets', { 
      params: { userId, month, year } 
    })
    return response.data
  },
  
  async createOrUpdate(budgetData, userId) {
    const requestData = {
      ...budgetData,
      userId: userId
    }
    const response = await api.post('/budgets', requestData)
    return response.data
  }
}