import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { decksAPI } from '../services/api'
import toast from 'react-hot-toast'

// Query keys
export const deckKeys = {
  all: ['decks'],
  lists: () => [...deckKeys.all, 'list'],
  list: (filters) => [...deckKeys.lists(), { filters }],
  details: () => [...deckKeys.all, 'detail'],
  detail: (id) => [...deckKeys.details(), id],
}

// Get all decks
export function useDecks(filters = {}) {
  return useQuery({
    queryKey: deckKeys.list(filters),
    queryFn: () => decksAPI.list(filters),
    select: (data) => data.data.decks,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get single deck
export function useDeck(id) {
  return useQuery({
    queryKey: deckKeys.detail(id),
    queryFn: () => decksAPI.get(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

// Create deck
export function useCreateDeck() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: decksAPI.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: deckKeys.lists() })
      toast.success('Deck created successfully')
      return data.data.deck
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create deck'
      toast.error(message)
    }
  })
}

// Update deck
export function useUpdateDeck() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...data }) => decksAPI.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: deckKeys.lists() })
      queryClient.invalidateQueries({ queryKey: deckKeys.detail(variables.id) })
      toast.success('Deck updated successfully')
      return data.data.deck
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update deck'
      toast.error(message)
    }
  })
}

// Delete deck
export function useDeleteDeck() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: decksAPI.delete,
    onSuccess: (_, deckId) => {
      queryClient.invalidateQueries({ queryKey: deckKeys.lists() })
      queryClient.removeQueries({ queryKey: deckKeys.detail(deckId) })
      toast.success('Deck deleted successfully')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete deck'
      toast.error(message)
    }
  })
}

// Generate deck with AI
export function useGenerateDeck() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: decksAPI.generate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: deckKeys.lists() })
      toast.success('Deck generation started')
      return data.data
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to generate deck'
      toast.error(message)
    }
  })
}

// Get generation status
export function useGenerationStatus(jobId) {
  return useQuery({
    queryKey: ['generation', jobId],
    queryFn: () => decksAPI.getGenerationStatus(jobId),
    select: (data) => data.data,
    enabled: !!jobId,
    refetchInterval: (data) => {
      // Stop polling when completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 2000 // Poll every 2 seconds
    },
  })
}