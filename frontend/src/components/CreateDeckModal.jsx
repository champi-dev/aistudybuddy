import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
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
  const { user, hasTokens, updateTokenUsage } = useAuthStore()
  
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
      updateTokenUsage(estimatedTokens)
      
      reset()
      onClose()
      toast.success('Deck generated successfully with ' + (result.cardsGenerated || result.deck?.card_count || 0) + ' cards!')
      
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
        if (error.response?.status === 500) {
          toast.error('Server error during generation. Please check your dashboard - the deck may have been created successfully.')
        } else {
          toast.error('Generation is taking longer than expected. Please check your dashboard - the deck may have been created successfully.')
        }
        // Still invalidate queries in case it worked
        queryClient.invalidateQueries(['decks'])
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-text-primary">Generate Deck with AI</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
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
                  <span className="text-sm font-medium text-text-primary">Token Usage</span>
                </div>
                <span className="text-sm text-text-secondary">
                  ~{estimatedTokens.toLocaleString()} tokens
                </span>
              </div>
              
              <div className="text-xs text-text-secondary">
                <p>Remaining today: {(user.dailyTokenLimit - user.tokensUsed).toLocaleString()} tokens</p>
              </div>

              {!hasTokens(estimatedTokens) && (
                <div className="flex items-center mt-2 text-warning">
                  <span className="text-xs">Insufficient tokens for this generation</span>
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
    </div>
  )
}