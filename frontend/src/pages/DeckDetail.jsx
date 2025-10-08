import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Play, Plus, Edit, Trash2, MoreVertical, BookOpen } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Button from '../components/ui/Button'
import { useDeck, useDeleteDeck } from '../hooks/useDecks'
import { cardsAPI } from '../services/api'
import toast from 'react-hot-toast'

export default function DeckDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showCardMenu, setShowCardMenu] = useState(null)
  const deleteDeckMutation = useDeleteDeck()
  const queryClient = useQueryClient()
  
  // Card mutations
  const deleteCardMutation = useMutation({
    mutationFn: (cardId) => cardsAPI.delete(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cards', id])
      toast.success('Card deleted successfully')
      setShowCardMenu(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete card')
    }
  })
  

  // Fetch deck data
  const { data: deck, isLoading: deckLoading, error: deckError } = useDeck(id)

  // Fetch cards data
  const { data: cards = [], isLoading: cardsLoading } = useQuery({
    queryKey: ['cards', id],
    queryFn: () => cardsAPI.list(id).then(res => res.data.cards),
    enabled: !!id
  })

  const isLoading = deckLoading || cardsLoading

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4 p-2 w-9 h-9 bg-surface-light rounded-lg animate-pulse"></div>
            <div>
              <div className="h-8 w-64 bg-surface-light rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-surface-light rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-surface-light rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-surface-light rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface rounded-lg p-4 border border-surface-light animate-pulse">
              <div className="h-4 bg-surface-light rounded mb-2"></div>
              <div className="h-8 bg-surface-light rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (deckError) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Deck not found</h3>
        <p className="text-text-secondary mb-6">The deck you're looking for doesn't exist or you don't have access to it.</p>
        <Button as={Link} to="/dashboard">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/dashboard"
            className="mr-4 p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-light"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{deck?.title}</h1>
            <p className="text-text-secondary">{deck?.description}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={async () => {
              if (window.confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
                try {
                  await deleteDeckMutation.mutateAsync(id)
                  navigate('/dashboard')
                } catch (error) {
                  console.error('Failed to delete deck:', error)
                }
              }
            }}
            className="text-error hover:bg-error/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Deck
          </Button>
          <Button as={Link} to={`/study/${id}`} disabled={cards.length === 0}>
            <Play className="h-4 w-4 mr-2" />
            Start Studying
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg p-4 border border-surface-light">
          <p className="text-text-secondary text-sm">Total Cards</p>
          <p className="text-2xl font-bold text-text-primary">{cards.length}</p>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-surface-light">
          <p className="text-text-secondary text-sm">Difficulty</p>
          <p className="text-2xl font-bold text-text-primary">
            {['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'][deck?.difficulty_level || 1]}
          </p>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-surface-light">
          <p className="text-text-secondary text-sm">Category</p>
          <p className="text-2xl font-bold text-text-primary">{deck?.category || 'Uncategorized'}</p>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-surface-light">
          <p className="text-text-secondary text-sm">Last Studied</p>
          <p className="text-2xl font-bold text-text-primary">
            {deck?.last_studied ? new Date(deck.last_studied).toLocaleDateString() : 'Never'}
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="bg-surface rounded-lg border border-surface-light">
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <h2 className="text-lg font-semibold text-text-primary">Cards</h2>
        </div>

        {cards.length > 0 ? (
          <div className="divide-y divide-surface-light">
            {cards.map((card) => (
              <div key={card.id} className="p-6 hover:bg-surface-light/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2">
                      <h3 className="font-medium text-text-primary mb-1">{card.front}</h3>
                      <p className="text-text-secondary text-sm">{card.back}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-text-secondary">
                      <span>Difficulty: {card.difficulty || 1}/5</span>
                      {card.hint_1 && <span>Has hints</span>}
                      {card.explanation && <span>Has explanation</span>}
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowCardMenu(showCardMenu === card.id ? null : card.id)}
                      className="p-1 text-text-secondary hover:text-text-primary rounded"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {showCardMenu === card.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-surface border border-surface-light rounded-lg shadow-lg z-10">
                        <button 
                          onClick={async () => {
                            if (window.confirm('Are you sure you want to delete this card?')) {
                              deleteCardMutation.mutate(card.id)
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-error hover:bg-surface-light"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No cards yet</h3>
            <p className="text-text-secondary mb-6">This deck doesn't have any cards. Try generating a new deck with AI.</p>
          </div>
        )}
      </div>

    </div>
  )
}