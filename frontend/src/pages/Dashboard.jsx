import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Clock, TrendingUp, Sparkles } from 'lucide-react'
import Button from '../components/ui/Button'
import DeckCard from '../components/DeckCard'
import CreateDeckModal from '../components/CreateDeckModal'
import GenerateDeckModal from '../components/GenerateDeckModal'
import { useDecks } from '../hooks/useDecks'
import { useAuthStore } from '../stores/authStore'

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  
  const { user } = useAuthStore()
  const { data: decks = [], isLoading, error } = useDecks({
    search: searchTerm,
    category: selectedCategory !== 'all' ? selectedCategory : undefined
  })

  // Extract unique categories from decks
  const categories = ['all', ...new Set(decks.map(deck => deck.category).filter(Boolean))]

  // Mock stats for now - these would come from analytics API
  const mockStats = {
    totalDecks: decks.length,
    totalCards: decks.reduce((sum, deck) => sum + (deck.cardCount || 0), 0),
    studyStreak: 7,
    weeklyAccuracy: 85
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.username}!</h1>
        <p className="text-primary-100">Ready to continue your learning journey?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 border border-surface-light">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-primary" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-text-primary">{mockStats.totalDecks}</p>
              <p className="text-text-secondary">Total Decks</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-surface-light">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-success" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-text-primary">{mockStats.studyStreak}</p>
              <p className="text-text-secondary">Day Streak</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-surface-light">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-secondary" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-text-primary">{mockStats.weeklyAccuracy}%</p>
              <p className="text-text-secondary">Weekly Accuracy</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-surface-light">
          <div className="flex items-center">
            <Sparkles className="h-8 w-8 text-warning" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-text-primary">{mockStats.totalCards}</p>
              <p className="text-text-secondary">Cards Studied</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Search */}
          <input
            type="text"
            placeholder="Search decks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-surface border border-surface-light rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
          />

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-surface border border-surface-light rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Deck
          </Button>
          
          <Button
            onClick={() => setShowGenerateModal(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
        </div>
      </div>

      {/* Decks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && (
          <>
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-surface rounded-lg border border-surface-light p-6 animate-pulse">
                <div className="h-4 bg-surface-light rounded mb-2"></div>
                <div className="h-3 bg-surface-light rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-surface-light rounded"></div>
              </div>
            ))}
          </>
        )}
        
        {!isLoading && decks.map(deck => (
          <DeckCard key={deck.id} deck={deck} />
        ))}
        
        {!isLoading && decks.length === 0 && (
          <div className="col-span-full text-center py-12">
            <BookOpen className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-2">No decks found</h3>
            <p className="text-text-secondary mb-6">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first deck to get started'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Deck
            </Button>
          </div>
        )}
        
        {error && (
          <div className="col-span-full text-center py-12">
            <div className="text-error mb-4">Failed to load decks</div>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-surface rounded-lg p-6 border border-surface-light">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-primary">Studied JavaScript Fundamentals</p>
              <p className="text-sm text-text-secondary">2 hours ago • 15 cards</p>
            </div>
            <div className="text-success text-sm font-medium">92% accuracy</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-primary">Generated React Hooks deck</p>
              <p className="text-sm text-text-secondary">1 day ago • 18 cards</p>
            </div>
            <div className="text-primary text-sm font-medium">AI Generated</div>
          </div>
          
          <div className="text-center pt-4">
            <Link
              to="/analytics"
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              View detailed analytics →
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateDeckModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      <GenerateDeckModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </div>
  )
}