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

          // Fetch actual daily token usage after login
          await get().refreshUser()

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

          // Fetch actual daily token usage after registration
          await get().refreshUser()

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
          const [userResponse, usageResponse] = await Promise.all([
            authAPI.me(),
            authAPI.getTokenUsage()
          ])

          // Merge user data with daily token usage
          set({
            user: {
              ...userResponse.data.user,
              // Use daily token usage instead of cumulative
              tokensUsed: usageResponse.data.usage.todayTokensUsed || 0,
              dailyTokenLimit: usageResponse.data.usage.dailyLimit || 10000
            }
          })
        } catch (error) {
          console.error('Refresh user error:', error)
          if (error.response?.status === 401) {
            get().setAuth(null, null)
            throw error // Re-throw to trigger App.jsx error handling
          }
          throw error
        }
      },
      
      // Check if user has enough tokens (for daily limit)
      hasTokens: (required = 100) => {
        const { user } = get()
        if (!user) return false

        const remaining = user.dailyTokenLimit - user.tokensUsed
        return remaining >= required
      },
      
      // Switch user for development testing
      switchUser: (userId) => {
        const users = {
          'test01': {
            id: 'c60af1eb-a07e-43c5-b599-ec19a9547bde',
            username: 'testuser01',
            email: 'testuser01@example.com',
            tokensUsed: 0,
            dailyTokenLimit: 10000
          },
          'test02': {
            id: '2388887a-9e5a-4cb9-a713-4e2ee6b81885',
            username: 'testuser02',
            email: 'testuser02@example.com',
            tokensUsed: 0,
            dailyTokenLimit: 10000
          }
        }
        
        const user = users[userId]
        if (user) {
          set({ user, token: `dev-token-${userId}` })
          toast.success(`Switched to user: ${user.username}`)
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