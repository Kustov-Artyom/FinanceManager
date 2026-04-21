import api from './api'

export const goalService = {
  async getAll(userId) {
    const res = await api.get('/goals', { params: { userId } })
    return res.data
  },
  async create(data, userId) {
    const res = await api.post('/goals', data, { params: { userId } })
    return res.data
  },
  async update(id, data, userId) {
    await api.put(`/goals/${id}`, data, { params: { userId } })
  },
  async topUp(id, amount, userId) {
    await api.post(`/goals/${id}/topup`, { amount }, { params: { userId } })
  },
  async delete(id, userId) {
    await api.delete(`/goals/${id}`, { params: { userId } })
  }
}