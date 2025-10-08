import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { X, BookOpen } from 'lucide-react'
import Button from './ui/Button'
import Input from './ui/Input'
import { useUpdateDeck } from '../hooks/useDecks'

export default function EditDeckModal({ isOpen, onClose, deck }) {
  const updateDeckMutation = useUpdateDeck()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  // Reset form when deck changes
  useEffect(() => {
    if (deck) {
      reset({
        title: deck.title,
        description: deck.description,
        category: deck.category,
        difficulty: deck.difficulty_level
      })
    }
  }, [deck, reset])

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
      await updateDeckMutation.mutateAsync({
        id: deck.id,
        ...data,
        difficulty: parseInt(data.difficulty)
      })
      onClose()
    } catch (error) {
      console.error('Failed to update deck:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-primary" />
            <h2 className="text-xl font-semibold text-text-primary">Edit Deck</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-1">
              Title
            </label>
            <Input
              id="title"
              {...register('title', { required: 'Title is required' })}
              placeholder="Enter deck title"
            />
            {errors.title && (
              <p className="text-error text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-1">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              className="w-full px-3 py-2 bg-surface-light border border-surface-light rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
              rows="3"
              placeholder="Enter deck description"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-text-primary mb-1">
              Category
            </label>
            <select
              id="category"
              {...register('category')}
              className="w-full px-3 py-2 bg-surface-light border border-surface-light rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-text-primary mb-1">
              Difficulty
            </label>
            <select
              id="difficulty"
              {...register('difficulty')}
              className="w-full px-3 py-2 bg-surface-light border border-surface-light rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>{diff.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateDeckMutation.isPending}
              className="flex-1"
            >
              {updateDeckMutation.isPending ? 'Updating...' : 'Update Deck'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}