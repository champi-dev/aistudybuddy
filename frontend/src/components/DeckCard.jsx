import { Link } from 'react-router-dom'
import { 
  BookOpen, 
  Clock, 
  MoreVertical, 
  Play, 
  Edit, 
  Trash2,
  Sparkles,
  Calendar
} from 'lucide-react'
import { useState } from 'react'
import Button from './ui/Button'
// import { formatDistanceToNow } from 'date-fns'

export default function DeckCard({ deck }) {
  const [showMenu, setShowMenu] = useState(false)

  const formatLastStudied = (dateString) => {
    if (!dateString) return 'Never studied'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
      
      if (diffInDays === 0) return 'Today'
      if (diffInDays === 1) return 'Yesterday'
      if (diffInDays < 7) return `${diffInDays} days ago`
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
      return `${Math.floor(diffInDays / 30)} months ago`
    } catch {
      return 'Some time ago'
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 1: return 'text-green-400'
      case 2: return 'text-blue-400'
      case 3: return 'text-yellow-400'
      case 4: return 'text-orange-400'
      case 5: return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getDifficultyLabel = (difficulty) => {
    const labels = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert']
    return labels[difficulty] || 'Unknown'
  }

  return (
    <div className="bg-surface rounded-lg border border-surface-light hover:border-primary/50 transition-colors group">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
                {deck.title}
              </h3>
              {deck.aiGenerated && (
                <Sparkles className="h-4 w-4 text-secondary" title="AI Generated" />
              )}
            </div>
            <p className="text-sm text-text-secondary line-clamp-2">
              {deck.description}
            </p>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-text-secondary hover:text-text-primary rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-surface border border-surface-light rounded-lg shadow-lg z-10">
                <button className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-light flex items-center">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-error hover:bg-surface-light flex items-center">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm text-text-secondary">
          <div className="flex items-center">
            <BookOpen className="h-4 w-4 mr-1" />
            {deck.cardCount} cards
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span className={getDifficultyColor(deck.difficulty)}>
              {getDifficultyLabel(deck.difficulty)}
            </span>
          </div>
        </div>

        {/* Category and Last Studied */}
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {deck.category}
          </span>
          
          <div className="flex items-center text-xs text-text-secondary">
            <Clock className="h-3 w-3 mr-1" />
            {formatLastStudied(deck.lastStudied)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            as={Link}
            to={`/study/${deck.id}`}
            size="sm"
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-1" />
            Study
          </Button>
          
          <Button
            as={Link}
            to={`/decks/${deck.id}`}
            variant="outline"
            size="sm"
          >
            View
          </Button>
        </div>
      </div>
    </div>
  )
}