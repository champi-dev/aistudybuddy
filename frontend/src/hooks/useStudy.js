import { useMutation, useQuery } from '@tanstack/react-query'
import { studyAPI, aiAPI } from '../services/api'
import toast from 'react-hot-toast'

// Start study session
export function useStartStudy() {
  return useMutation({
    mutationFn: async ({ deckId }) => {
      const response = await studyAPI.start(deckId)
      return response.data || response
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to start study session'
      toast.error(message)
    }
  })
}

// Submit answer
export function useSubmitAnswer() {
  return useMutation({
    mutationFn: ({ sessionId, cardId, ...data }) => 
      studyAPI.answer(sessionId, cardId, data),
    onSuccess: (data) => {
      return data.data
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to submit answer'
      toast.error(message)
    }
  })
}

// Get hint
export function useGetHint() {
  return useMutation({
    mutationFn: ({ cardId, level }) => studyAPI.getHint(cardId, level),
    onSuccess: (data) => {
      return data.data
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to get hint'
      toast.error(message)
    }
  })
}

// Complete study session
export function useCompleteStudy() {
  return useMutation({
    mutationFn: studyAPI.complete,
    onSuccess: (data) => {
      toast.success('Study session completed!')
      return data.data
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to complete session'
      toast.error(message)
    }
  })
}

// Get study session details
export function useStudySession(sessionId) {
  return useQuery({
    queryKey: ['study', 'session', sessionId],
    queryFn: () => studyAPI.getSession(sessionId),
    select: (data) => data.data,
    enabled: !!sessionId,
  })
}

// AI explanation
export function useGetExplanation() {
  return useMutation({
    mutationFn: aiAPI.explain,
    onSuccess: (data) => {
      return data.data
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to get explanation'
      if (error.response?.data?.type === 'TOKEN_LIMIT_EXCEEDED') {
        toast.error('Daily AI token limit exceeded')
      } else {
        toast.error(message)
      }
    }
  })
}

// AI hint generation
export function useGenerateHint() {
  return useMutation({
    mutationFn: aiAPI.getHint,
    onSuccess: (data) => {
      return data.data
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to generate hint'
      if (error.response?.data?.type === 'TOKEN_LIMIT_EXCEEDED') {
        toast.error('Daily AI token limit exceeded')
      } else {
        toast.error(message)
      }
    }
  })
}