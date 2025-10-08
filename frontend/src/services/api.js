import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token and dev user ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage')
  if (token) {
    try {
      const parsed = JSON.parse(token)
      
      // Add auth token if available
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`
      }
      
      // In development mode, add dev-user-id header
      if (import.meta.env.DEV && parsed.state?.user?.id) {
        config.headers['dev-user-id'] = parsed.state.user.id
      }
    } catch (error) {
      console.error('Error parsing auth token:', error)
    }
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An error occurred'
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      message = 'Network error. Please check your connection and try again.'
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timeout. Please try again.'
    } else if (error.response) {
      // Server responded with error status
      const status = error.response.status
      message = error.response.data?.message || `Server error (${status})`
      
      if (status === 403) {
        message = 'Access denied. Please check your permissions.'
      } else if (status === 404) {
        message = 'Resource not found.'
      } else if (status === 429) {
        message = 'Too many requests. Please wait and try again.'
      } else if (status >= 500) {
        message = 'Server error. Please try again later.'
      }
    } else if (error.request) {
      // Request was made but no response received
      message = 'No response from server. Please check your connection.'
    }
    
    // Don't show error toast for authentication errors (handled by auth store)
    if (error.response?.status !== 401) {
      toast.error(message)
    }
    
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (email, username, password) => 
    api.post('/auth/register', { email, username, password }),
  
  refresh: () => 
    api.post('/auth/refresh'),
  
  me: () => 
    api.get('/auth/me'),
  
  logout: () => 
    api.post('/auth/logout')
}

// Decks API
export const decksAPI = {
  list: (params = {}) => 
    api.get('/decks', { params }),
  
  get: (id) => 
    api.get(`/decks/${id}`),
  
  create: (data) => 
    api.post('/decks', data),
  
  update: (id, data) => 
    api.put(`/decks/${id}`, data),
  
  delete: (id) => 
    api.delete(`/decks/${id}`),
  
  generate: (data) => 
    api.post('/decks/generate', data),
  
  getGenerationStatus: (jobId) => 
    api.get(`/decks/generate/status/${jobId}`)
}

// Cards API
export const cardsAPI = {
  list: (deckId) => 
    api.get(`/cards/deck/${deckId}`),
  
  get: (id) => 
    api.get(`/cards/${id}`),
  
  create: (data) => 
    api.post('/cards', data),
  
  update: (id, data) => 
    api.put(`/cards/${id}`, data),
  
  delete: (id) => 
    api.delete(`/cards/${id}`),
  
  batchCreate: (data) => 
    api.post('/cards/batch', data)
}

// Study API
export const studyAPI = {
  start: (deckId) => 
    api.post('/study/start', { deckId }),
  
  answer: (sessionId, cardId, data) => 
    api.post('/study/answer', { sessionId, cardId, ...data }),
  
  getHint: (cardId, level) => 
    api.get(`/study/hint/${cardId}/${level}`),
  
  complete: (sessionId) => 
    api.post(`/study/complete/${sessionId}`),
  
  getSession: (sessionId) => 
    api.get(`/study/session/${sessionId}`)
}

// Analytics API
export const analyticsAPI = {
  getProgress: () => 
    api.get('/analytics/progress'),
  
  getStreaks: () => 
    api.get('/analytics/streaks'),
  
  getInsights: () => 
    api.get('/analytics/insights')
}

// AI API
export const aiAPI = {
  getUsage: () => 
    api.get('/ai/usage'),
  
  explain: (data) => 
    api.post('/ai/explain', data),
  
  getHint: (data) => 
    api.post('/ai/hint', data),
  
  generateQuiz: (data) => 
    api.post('/ai/generate-quiz', data),
  
  improveCard: (data) => 
    api.post('/ai/improve-card', data)
}

export default api