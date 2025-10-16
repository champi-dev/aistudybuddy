import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { X, Sparkles } from 'lucide-react'
import Button from './ui/Button'
import Input from './ui/Input'
import { useGenerateDeck } from '../hooks/useDecks'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

export default function CreateDeckModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const generateDeckMutation = useGenerateDeck()
  const { user, hasTokens, refreshUser } = useAuthStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    defaultValues: {
      cardCount: 10,
      difficulty: 2
    }
  })

  const cardCount = watch('cardCount')
  const difficulty = watch('difficulty')
  
  // Estimate tokens for AI generation
  const estimatedTokens = Math.round(cardCount * 100 * (1 + (difficulty - 1) * 0.2))

  const categories = [
    'Programming',
    'Language',
    'Science',
    'Mathematics',
    'History',
    'Geography',
    'Literature',
    'Art',
    'Music',
    'Sports',
    'Other'
  ]

  const difficulties = [
    { value: 1, label: 'Beginner' },
    { value: 2, label: 'Easy' },
    { value: 3, label: 'Medium' },
    { value: 4, label: 'Hard' },
    { value: 5, label: 'Expert' }
  ]

  const onSubmit = async (data) => {
    try {
      // Check token availability for AI generation
      if (!hasTokens(estimatedTokens)) {
        toast.error(`Insufficient tokens. You need ${estimatedTokens} tokens but only have ${user?.dailyTokenLimit - user?.tokensUsed} remaining.`)
        return
      }

      // Generate deck with AI
      const generationData = {
        ...data,
        cardCount: data.cardCount,
        difficulty: data.difficulty,
        type: 'topic'
      }
      
      const result = await generateDeckMutation.mutateAsync(generationData)

      // Extract the actual data from axios response
      const responseData = result.data || result
      const cardsGenerated = responseData.cardsGenerated || 0

      // Refresh user data to get updated token usage from backend
      await refreshUser()

      reset()
      onClose()
      toast.success(`Deck generated successfully with ${cardsGenerated} cards!`)
      
      // Invalidate queries to refresh the dashboard
      queryClient.invalidateQueries(['decks'])
      
      // Navigate to the generated deck
      if (result.deck?.id) {
        navigate(`/deck/${result.deck.id}`)
      }
    } catch (error) {
      console.error('Error generating deck:', error)
      
      // Handle timeout, service unavailable, or server errors
      if (error.code === 'ECONNABORTED' || error.response?.status === 503 || error.response?.status === 500) {
        if (error.code === 'ECONNABORTED') {
          toast.error('Generation is taking longer than expected. Please check your dashboard in a moment - the deck may still be processing.')
        } else if (error.response?.status === 500) {
          toast.error('Server error during generation. Please check your dashboard - the deck may have been created successfully.')
        } else {
          toast.error('Service temporarily unavailable. Please check your dashboard - the deck may have been created successfully.')
        }
        // Still invalidate queries in case it worked
        queryClient.invalidateQueries(['decks'])
        // Close modal and reset form
        reset()
        onClose()
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to generate deck. Please try again.'
        toast.error(errorMessage)
      }
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-[9999]">
      <div className="bg-surface rounded-lg sm:rounded-xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-surface-light sticky top-0 bg-surface z-10">
          <div className="flex items-center min-w-0 flex-1">
            <Sparkles className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold text-text-primary truncate">Generate Deck with AI</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-text-secondary hover:text-text-primary ml-2 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <Input
            label="Deck Title"
            placeholder="e.g., JavaScript Fundamentals"
            {...register('title', {
              required: 'Title is required',
              maxLength: {
                value: 255,
                message: 'Title must be less than 255 characters'
              }
            })}
            error={errors.title?.message}
          />

          <Input
            label="Topic"
            placeholder="e.g., French Revolution, Quantum Physics, React Hooks"
            {...register('topic', {
              required: 'Topic is required for AI generation',
              maxLength: {
                value: 500,
                message: 'Topic must be less than 500 characters'
              }
            })}
            error={errors.topic?.message}
            helperText="Describe what you want to learn about"
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Description
            </label>
            <textarea
              placeholder="Brief description of what this deck covers..."
              rows={3}
              className="block w-full rounded-lg border border-surface-light px-3 py-2 text-sm bg-background text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              {...register('description', {
                maxLength: {
                  value: 1000,
                  message: 'Description must be less than 1000 characters'
                }
              })}
            />
            {errors.description && (
              <p className="text-sm text-error mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* AI Generation Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Number of Cards
              </label>
              <select
                className="block w-full rounded-lg border border-surface-light px-3 py-2 text-sm bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                {...register('cardCount', { valueAsNumber: true })}
              >
                {[5, 10, 15, 20, 25, 30].map(count => (
                  <option key={count} value={count}>
                    {count} cards
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Difficulty Level
              </label>
              <select
                className="block w-full rounded-lg border border-surface-light px-3 py-2 text-sm bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                {...register('difficulty', { valueAsNumber: true })}
              >
                {difficulties.map(diff => (
                  <option key={diff.value} value={diff.value}>
                    {diff.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Token Usage Info */}
          {user && (
            <div className="bg-background rounded-lg p-4 border border-surface-light">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 text-secondary mr-2" />
                  <span className="text-sm font-medium text-text-primary">AI Token Usage</span>
                </div>
                <span className="text-sm font-semibold text-primary">
                  ~{estimatedTokens.toLocaleString()} tokens needed
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Used today:</span>
                  <span className="font-medium text-text-primary">{user.tokensUsed.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Daily limit:</span>
                  <span className="font-medium text-text-primary">{user.dailyTokenLimit.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Remaining:</span>
                  <span className={`font-medium ${hasTokens(estimatedTokens) ? 'text-green-600' : 'text-red-600'}`}>
                    {(user.dailyTokenLimit - user.tokensUsed).toLocaleString()} tokens
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-text-secondary mb-1">
                    <span>Usage Progress</span>
                    <span>{Math.round((user.tokensUsed / user.dailyTokenLimit) * 100)}%</span>
                  </div>
                  <div className="w-full bg-surface-light rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        (user.tokensUsed / user.dailyTokenLimit) > 0.8 ? 'bg-red-500' : 
                        (user.tokensUsed / user.dailyTokenLimit) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((user.tokensUsed / user.dailyTokenLimit) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {!hasTokens(estimatedTokens) && (
                <div className="flex items-center mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                    ⚠️ Insufficient tokens for this generation. Try reducing the number of cards.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={generateDeckMutation.isPending || !hasTokens(estimatedTokens)}
              className="flex-1"
            >
              {generateDeckMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Deck
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}