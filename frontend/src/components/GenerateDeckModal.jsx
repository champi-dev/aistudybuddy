import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Sparkles, Zap, FileText, Link as LinkIcon, AlertCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import Button from './ui/Button'
import Input from './ui/Input'
import { useAuthStore } from '../stores/authStore'
import { useGenerateDeck } from '../hooks/useDecks'
import toast from 'react-hot-toast'

export default function GenerateDeckModal({ isOpen, onClose }) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('topic')
  const [isGenerating, setIsGenerating] = useState(false)
  const [estimatedTokens, setEstimatedTokens] = useState(0)
  const { user, hasTokens, updateTokenUsage } = useAuthStore()
  const generateDeckMutation = useGenerateDeck()
  
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

  // Estimate tokens based on card count and difficulty
  useState(() => {
    const baseTokensPerCard = 100
    const difficultyMultiplier = 1 + (difficulty - 1) * 0.2
    const estimated = Math.round(cardCount * baseTokensPerCard * difficultyMultiplier)
    setEstimatedTokens(estimated)
  }, [cardCount, difficulty])

  const tabs = [
    { id: 'topic', label: 'From Topic', icon: Sparkles },
    { id: 'text', label: 'From Text', icon: FileText },
    { id: 'url', label: 'From URL', icon: LinkIcon }
  ]

  const difficulties = [
    { value: 1, label: 'Beginner' },
    { value: 2, label: 'Easy' },
    { value: 3, label: 'Medium' },
    { value: 4, label: 'Hard' },
    { value: 5, label: 'Expert' }
  ]

  const cardCountOptions = [5, 10, 15, 20, 25, 30, 40, 50]

  const onSubmit = async (data) => {
    if (!hasTokens(estimatedTokens)) {
      toast.error(`Insufficient tokens. You need ${estimatedTokens} tokens but only have ${user?.dailyTokenLimit - user?.tokensUsed} remaining.`)
      return
    }

    setIsGenerating(true)
    
    try {
      // Prepare generation data based on active tab
      const generationData = {
        cardCount: data.cardCount,
        difficulty: data.difficulty,
        type: activeTab,
        ...data
      }

      console.log('Generating deck:', generationData)
      const result = await generateDeckMutation.mutateAsync(generationData)
      
      // Update token usage
      updateTokenUsage(estimatedTokens)
      
      reset()
      onClose()
      toast.success('Deck generated successfully with ' + (result.cardsGenerated || result.deck?.card_count || 0) + ' cards!')
      
      // Invalidate queries to refresh the dashboard
      queryClient.invalidateQueries(['decks'])
      
    } catch (error) {
      console.error('Error generating deck:', error)
      const errorMessage = error.response?.data?.message || 'Failed to generate deck. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  const remainingTokens = user ? user.dailyTokenLimit - user.tokensUsed : 0
  const canGenerate = hasTokens(estimatedTokens)

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

        {/* Tabs */}
        <div className="border-b border-surface-light">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Content Input */}
          {activeTab === 'topic' && (
            <Input
              label="Topic"
              placeholder="e.g., French Revolution, Quantum Physics, React Hooks"
              {...register('topic', {
                required: 'Topic is required',
                maxLength: {
                  value: 500,
                  message: 'Topic must be less than 500 characters'
                }
              })}
              error={errors.topic?.message}
              helperText="Describe what you want to learn about"
            />
          )}

          {activeTab === 'text' && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Text Content
              </label>
              <textarea
                placeholder="Paste your text content here (articles, notes, documentation, etc.)"
                rows={6}
                className="block w-full rounded-lg border border-surface-light px-3 py-2 text-sm bg-background text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                {...register('text', {
                  required: 'Text content is required',
                  maxLength: {
                    value: 10000,
                    message: 'Text must be less than 10,000 characters'
                  }
                })}
              />
              {errors.text && (
                <p className="text-sm text-error mt-1">{errors.text.message}</p>
              )}
              <p className="text-xs text-text-secondary mt-1">
                The AI will extract key concepts and create flashcards
              </p>
            </div>
          )}

          {activeTab === 'url' && (
            <Input
              label="URL"
              type="url"
              placeholder="https://example.com/article"
              {...register('url', {
                required: 'URL is required',
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid URL'
                }
              })}
              error={errors.url?.message}
              helperText="We'll extract content from this webpage"
            />
          )}

          {/* Configuration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Number of Cards
              </label>
              <select
                className="block w-full rounded-lg border border-surface-light px-3 py-2 text-sm bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                {...register('cardCount', { valueAsNumber: true })}
              >
                {cardCountOptions.map(count => (
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
          <div className="bg-background rounded-lg p-4 border border-surface-light">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Zap className="h-4 w-4 text-secondary mr-2" />
                <span className="text-sm font-medium text-text-primary">Token Usage</span>
              </div>
              <span className="text-sm text-text-secondary">
                ~{estimatedTokens.toLocaleString()} tokens
              </span>
            </div>
            
            <div className="text-xs text-text-secondary">
              <p>Remaining today: {remainingTokens.toLocaleString()} tokens</p>
            </div>

            {!canGenerate && (
              <div className="flex items-center mt-2 text-warning">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="text-xs">Insufficient tokens for this generation</span>
              </div>
            )}
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
              disabled={isGenerating || !canGenerate}
              className="flex-1"
            >
              {isGenerating ? (
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