import api from './api'

const authService = {
  getGoogleAuthUrl: async () => {
    const response = await api.post('/auth/google/url')
    return response.data
  },

  handleGoogleCallback: async (code) => {
    const response = await api.get(`/auth/google/callback?code=${code}`)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  },

  verifyToken: async () => {
    const response = await api.get('/auth/verify')
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
  }
}

export default authService