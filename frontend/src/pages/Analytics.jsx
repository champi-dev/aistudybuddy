import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { BookOpen, Clock, TrendingUp, Target, Calendar, Award } from 'lucide-react'

export default function Analytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics/progress').then(res => res.data),
    refetchOnWindowFocus: true,
    refetchOnMount: 'always'
  })

  const { data: insights } = useQuery({
    queryKey: ['insights'],
    queryFn: () => api.get('/analytics/insights').then(res => res.data),
    refetchOnWindowFocus: true,
    refetchOnMount: 'always'
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface rounded-lg p-6 border border-surface-light animate-pulse">
              <div className="h-8 bg-surface-light rounded mb-2"></div>
              <div className="h-4 bg-surface-light rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const stats = analytics?.totalStats || {}
  const streaks = analytics?.streaks || {}
  const topDecks = analytics?.topDecks || []
  const recentActivity = analytics?.recentActivity || []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-surface rounded-lg p-6 border border-surface-light">
          <div className="flex items-center">
            <BookOpen className="h-8 w-8 text-primary" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-text-primary">{stats.totalSessions || 0}</p>
              <p className="text-text-secondary">Study Sessions</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-surface-light">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-success" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-text-primary">{stats.totalCardsStudied || 0}</p>
              <p className="text-text-secondary">Cards Studied</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-surface-light">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-secondary" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-text-primary">{stats.averageAccuracy || 0}%</p>
              <p className="text-text-secondary">Average Accuracy</p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-6 border border-surface-light">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-warning" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-text-primary">{streaks.current || 0}</p>
              <p className="text-text-secondary">Current Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface rounded-lg p-6 border border-surface-light">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Study Activity</h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-surface-light last:border-0">
                <div>
                  <p className="text-text-primary font-medium">{new Date(activity.date).toLocaleDateString()}</p>
                  <p className="text-sm text-text-secondary">{activity.sessions} sessions • {activity.cards} cards</p>
                </div>
                <div className="text-success font-medium">{activity.accuracy}% accuracy</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">No study activity yet</p>
            <p className="text-sm text-text-secondary mt-2">Start studying to see your progress here!</p>
          </div>
        )}
      </div>

      {/* Top Performing Decks */}
      <div className="bg-surface rounded-lg p-6 border border-surface-light">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Top Performing Decks</h2>
        {topDecks.length > 0 ? (
          <div className="space-y-3">
            {topDecks.slice(0, 5).map((deck, index) => (
              <div key={deck.id} className="flex items-center justify-between py-2 border-b border-surface-light last:border-0">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">{deck.title}</p>
                    <p className="text-sm text-text-secondary">{deck.category} • {deck.sessionCount} sessions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-success font-medium">{deck.averageAccuracy}%</p>
                  <p className="text-sm text-text-secondary">{deck.totalCards} cards</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <p className="text-text-secondary">No deck performance data yet</p>
            <p className="text-sm text-text-secondary mt-2">Study some decks to see your best performers!</p>
          </div>
        )}
      </div>

      {/* AI Insights */}
      {insights?.insights && (
        <div className="bg-surface rounded-lg p-6 border border-surface-light">
          <h2 className="text-lg font-semibold text-text-primary mb-4">AI Insights</h2>
          <div className="space-y-3">
            {insights.insights.map((insight, index) => (
              <div key={index} className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-text-primary">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}