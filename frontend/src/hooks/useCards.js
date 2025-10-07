import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cardsAPI } from '../services/api'
import { deckKeys } from './useDecks'
import toast from 'react-hot-toast'

// Query keys
export const cardKeys = {
  all: ['cards'],
  lists: () => [...cardKeys.all, 'list'],
  list: (deckId) => [...cardKeys.lists(), deckId],
  details: () => [...cardKeys.all, 'detail'],
  detail: (id) => [...cardKeys.details(), id],
}

// Get cards for a deck
export function useCards(deckId) {
  return useQuery({
    queryKey: cardKeys.list(deckId),
    queryFn: () => cardsAPI.list(deckId),
    select: (data) => data.data.cards,
    enabled: !!deckId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get single card
export function useCard(id) {
  return useQuery({
    queryKey: cardKeys.detail(id),
    queryFn: () => cardsAPI.get(id),
    select: (data) => data.data.card,
    enabled: !!id,
  })
}

// Create card
export function useCreateCard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: cardsAPI.create,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.list(variables.deck_id) })
      queryClient.invalidateQueries({ queryKey: deckKeys.detail(variables.deck_id) })
      toast.success('Card created successfully')
      return data.data.card
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create card'
      toast.error(message)
    }
  })
}

// Update card
export function useUpdateCard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...data }) => cardsAPI.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all })
      queryClient.setQueryData(cardKeys.detail(variables.id), data.data.card)
      toast.success('Card updated successfully')
      return data.data.card
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to update card'
      toast.error(message)
    }
  })
}

// Delete card
export function useDeleteCard() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: cardsAPI.delete,
    onSuccess: (_, cardId) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.all })
      queryClient.removeQueries({ queryKey: cardKeys.detail(cardId) })
      toast.success('Card deleted successfully')
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to delete card'
      toast.error(message)
    }
  })
}

// Batch create cards
export function useBatchCreateCards() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: cardsAPI.batchCreate,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: cardKeys.list(variables.deck_id) })
      queryClient.invalidateQueries({ queryKey: deckKeys.detail(variables.deck_id) })
      toast.success(`${data.data.cards.length} cards created successfully`)
      return data.data.cards
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to create cards'
      toast.error(message)
    }
  })
}