import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Play, Plus, Edit, Trash2, MoreVertical } from 'lucide-react'
import Button from '../components/ui/Button'

// Mock data
const mockDeck = {
  id: '1',
  title: 'JavaScript Fundamentals',
  description: 'Core JavaScript concepts and syntax for web development',
  category: 'Programming',
  difficulty: 2,
  cardCount: 25,
  aiGenerated: false,
  createdAt: '2024-01-10T10:00:00Z'
}

const mockCards = [
  {
    id: '1',
    front: 'What is a closure in JavaScript?',
    back: 'A closure is a feature where an inner function has access to variables from its outer scope even after the outer function has returned.',
    difficulty: 3
  },
  {
    id: '2',
    front: 'What is the difference between let and var?',
    back: 'let has block scope while var has function scope. let cannot be redeclared in the same scope.',
    difficulty: 2
  },
  {
    id: '3',
    front: 'What is event bubbling?',
    back: 'Event bubbling is when an event starts from the target element and bubbles up through its parent elements.',
    difficulty: 2
  }
]

export default function DeckDetail() {
  const { id } = useParams()
  const [showCardMenu, setShowCardMenu] = useState(null)

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
            <h1 className="text-2xl font-bold text-text-primary">{mockDeck.title}</h1>
            <p className="text-text-secondary">{mockDeck.description}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Deck
          </Button>
          <Button as={Link} to={`/study/${id}`}>
            <Play className="h-4 w-4 mr-2" />
            Start Studying
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-lg p-4 border border-surface-light">
          <p className="text-text-secondary text-sm">Total Cards</p>
          <p className="text-2xl font-bold text-text-primary">{mockDeck.cardCount}</p>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-surface-light">
          <p className="text-text-secondary text-sm">Difficulty</p>
          <p className="text-2xl font-bold text-text-primary">
            {['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Expert'][mockDeck.difficulty]}
          </p>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-surface-light">
          <p className="text-text-secondary text-sm">Category</p>
          <p className="text-2xl font-bold text-text-primary">{mockDeck.category}</p>
        </div>
        <div className="bg-surface rounded-lg p-4 border border-surface-light">
          <p className="text-text-secondary text-sm">Progress</p>
          <p className="text-2xl font-bold text-text-primary">0%</p>
        </div>
      </div>

      {/* Cards */}
      <div className="bg-surface rounded-lg border border-surface-light">
        <div className="flex items-center justify-between p-6 border-b border-surface-light">
          <h2 className="text-lg font-semibold text-text-primary">Cards</h2>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </div>

        <div className="divide-y divide-surface-light">
          {mockCards.map((card) => (
            <div key={card.id} className="p-6 hover:bg-surface-light/50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2">
                    <h3 className="font-medium text-text-primary mb-1">{card.front}</h3>
                    <p className="text-text-secondary text-sm">{card.back}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span>Difficulty: {card.difficulty}/5</span>
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
                      <button className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-light">
                        Edit
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-error hover:bg-surface-light">
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}