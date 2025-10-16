import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, BookOpen, Clock, TrendingUp, Sparkles } from 'lucide-react'
import Button from '../components/ui/Button'
import DeckCard from '../components/DeckCard'
import CreateDeckModal from '../components/CreateDeckModal'
import { useDecks } from '../hooks/useDecks'
import { useAuthStore } from '../stores/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { user } = useAuthStore()
  const { data: decks = [], isLoading, error } = useDecks({
    search: searchTerm
  })

  // Fetch real analytics data
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics/progress').then(res => res.data),
    enabled: !!user,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always'
  })

  // Use real analytics data instead of mock
  const stats = {
    totalDecks: decks.length,
    totalCards: analytics?.totalStats?.totalCardsStudied || 0,
    studyStreak: analytics?.streaks?.current || 0,
    weeklyAccuracy: analytics?.totalStats?.averageAccuracy || 0
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-lg sm:rounded-xl p-4 sm:p-6 text-white">
        <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Welcome back, {user?.username}!</h1>
        <p className="text-sm sm:text-base text-primary-100">Ready to continue your learning journey?</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-surface rounded-lg p-3 sm:p-4 md:p-6 border border-surface-light">
          <div className="flex flex-col sm:flex-row items-start sm:items-center">
            <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary mb-2 sm:mb-0" />
            <div className="sm:ml-3 md:ml-4">
              <p className="text-xl sm:text-2xl font-bold text-text-primary">{stats.totalDecks}</p>
              <p className="text-xs sm:text-sm text-text-secondary">Total Decks</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-3 sm:p-4 md:p-6 border border-surface-light">
          <div className="flex flex-col sm:flex-row items-start sm:items-center">
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-success mb-2 sm:mb-0" />
            <div className="sm:ml-3 md:ml-4">
              <p className="text-xl sm:text-2xl font-bold text-text-primary">{stats.studyStreak}</p>
              <p className="text-xs sm:text-sm text-text-secondary">Day Streak</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-3 sm:p-4 md:p-6 border border-surface-light">
          <div className="flex flex-col sm:flex-row items-start sm:items-center">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-secondary mb-2 sm:mb-0" />
            <div className="sm:ml-3 md:ml-4">
              <p className="text-xl sm:text-2xl font-bold text-text-primary">{stats.weeklyAccuracy}%</p>
              <p className="text-xs sm:text-sm text-text-secondary">Weekly Accuracy</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-3 sm:p-4 md:p-6 border border-surface-light">
          <div className="flex flex-col sm:flex-row items-start sm:items-center">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-warning mb-2 sm:mb-0" />
            <div className="sm:ml-3 md:ml-4">
              <p className="text-xl sm:text-2xl font-bold text-text-primary">{stats.totalCards}</p>
              <p className="text-xs sm:text-sm text-text-secondary">Cards Studied</p>
            </div>
          </div>
        </div>

        {/* Token Usage Card */}
        {user && (
          <div className="bg-surface rounded-lg p-3 sm:p-4 md:p-6 border border-surface-light col-span-2 sm:col-span-1">
            <div className="flex flex-col sm:flex-row items-start sm:items-center w-full">
              <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-secondary mb-2 sm:mb-0" />
              <div className="sm:ml-3 md:ml-4 w-full">
                <div className="flex items-baseline gap-1">
                  <p className="text-base sm:text-lg font-bold text-text-primary">
                    {(user.dailyTokenLimit - user.tokensUsed).toLocaleString()}
                  </p>
                  <span className="text-xs text-text-secondary">
                    / {user.dailyTokenLimit.toLocaleString()}
                  </span>
                </div>
                <p className="text-text-secondary text-xs sm:text-sm">AI Tokens Left</p>
                <div className="w-full bg-surface-light rounded-full h-1 mt-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      (user.tokensUsed / user.dailyTokenLimit) > 0.8 ? 'bg-red-500' :
                      (user.tokensUsed / user.dailyTokenLimit) > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min((user.tokensUsed / user.dailyTokenLimit) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search decks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:flex-1 sm:max-w-xs px-3 sm:px-4 py-2 bg-surface border border-surface-light rounded-lg text-sm sm:text-base text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* Action Buttons */}
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          <span className="hidden xs:inline">Generate with AI</span>
          <span className="xs:hidden">Generate</span>
        </Button>
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
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Create your first deck to get started'}
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Your First Deck
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
          {analytics?.recentActivity?.length > 0 ? (
            analytics.recentActivity.slice(0, 3).map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-text-primary">Studied {activity.deckTitle || 'Unknown Deck'}</p>
                  <p className="text-sm text-text-secondary">
                    {new Date(activity.date).toLocaleDateString()} • {activity.cards} cards
                  </p>
                </div>
                <div className="text-success text-sm font-medium">{activity.accuracy}% accuracy</div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-text-secondary">No recent study activity</p>
              <p className="text-sm text-text-secondary mt-2">Start studying to see your progress here!</p>
            </div>
          )}
          
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
    </div>
  )
}