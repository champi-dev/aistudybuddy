import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { X, Sparkles } from 'lucide-react'
import Button from './ui/Button'
import Input from './ui/Input'
import { useGenerateDeck } from '../hooks/useDecks'
import toast from 'react-hot-toast'

export default function CreateDeckModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const generateDeckMutation = useGenerateDeck()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      cardCount: 10,
      difficulty: 2
    }
  })

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
      const cardsRequested = responseData.cardsRequested || data.cardCount

      reset()
      onClose()
      toast.success(
        cardsGenerated < cardsRequested
          ? `Deck generated with ${cardsGenerated} of ${cardsRequested} requested cards`
          : `Deck generated successfully with ${cardsGenerated} cards!`
      )

      // Invalidate queries to refresh the dashboard
      queryClient.invalidateQueries(['decks'])

      // Navigate to the generated deck
      if (result.deck?.id) {
        navigate(`/deck/${result.deck.id}`)
      }
    } catch (error) {
      console.error('Error generating deck:', error)

      if (error.code === 'ECONNABORTED') {
        toast.error('Generation is taking longer than expected. Please check your dashboard in a moment - the deck may still be processing.')
        queryClient.invalidateQueries(['decks'])
        reset()
        onClose()
      } else {
        // The backend rolls back the deck on any generation failure, so
        // nothing was created — surface the real reason instead of guessing.
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
      <div className="bg-surface rounded-lg sm:rounded-xl max-w-lg w-full modal-panel overflow-y-auto">
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
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
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
              disabled={generateDeckMutation.isPending}
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