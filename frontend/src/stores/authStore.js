import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      
      // Set auth data
      setAuth: (user, token) => {
        set({ user, token })
      },
      
      // Initialize auth from storage (handled by API service)
      initialize: () => {
        // Auth token is handled by the API service
      },
      
      // Login
      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.login(email, password)
          const { user, token } = response.data
          
          get().setAuth(user, token)
          toast.success('Welcome back!')
          return true
        } catch (error) {
          const message = error.response?.data?.message || 'Login failed'
          toast.error(message)
          return false
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Register
      register: async (email, username, password) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.register(email, username, password)
          const { user, token } = response.data
          
          get().setAuth(user, token)
          toast.success('Account created successfully!')
          return true
        } catch (error) {
          const message = error.response?.data?.message || 'Registration failed'
          toast.error(message)
          return false
        } finally {
          set({ isLoading: false })
        }
      },
      
      // Logout
      logout: async () => {
        try {
          await authAPI.logout()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          get().setAuth(null, null)
          toast.success('Logged out successfully')
        }
      },
      
      // Refresh user data
      refreshUser: async () => {
        try {
          const response = await authAPI.me()
          set({ user: response.data.user })
        } catch (error) {
          console.error('Refresh user error:', error)
          if (error.response?.status === 401) {
            get().logout()
          }
        }
      },
      
      // Check if user has enough tokens
      hasTokens: (required = 100) => {
        const { user } = get()
        if (!user) return false
        
        const remaining = user.dailyTokenLimit - user.tokensUsed
        return remaining >= required
      },
      
      // Update token usage
      updateTokenUsage: (tokensUsed) => {
        const { user } = get()
        if (user) {
          set({ 
            user: { 
              ...user, 
              tokensUsed: user.tokensUsed + tokensUsed 
            } 
          })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize auth after rehydration
        if (state?.token) {
          state.initialize()
        }
      }
    }
  )
)

// The token refresh is now handled in the API service