import { useForm } from 'react-hook-form'
import { X, BookOpen } from 'lucide-react'
import Button from './ui/Button'
import Input from './ui/Input'
import { useCreateDeck } from '../hooks/useDecks'

export default function CreateDeckModal({ isOpen, onClose }) {
  const createDeckMutation = useCreateDeck()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

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
      await createDeckMutation.mutateAsync(data)
      reset()
      onClose()
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 text-primary mr-2" />
            <h2 className="text-lg font-semibold text-text-primary">Create New Deck</h2>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Category
              </label>
              <select
                className="block w-full rounded-lg border border-surface-light px-3 py-2 text-sm bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                {...register('category')}
              >
                <option value="">Select category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Difficulty
              </label>
              <select
                className="block w-full rounded-lg border border-surface-light px-3 py-2 text-sm bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                {...register('difficulty_level', { valueAsNumber: true })}
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
              disabled={createDeckMutation.isPending}
              className="flex-1"
            >
              {createDeckMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Deck'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}