import { motion } from 'framer-motion'
import { Trophy, Target, Clock, RefreshCw, ArrowLeft, TrendingUp } from 'lucide-react'
import Button from './ui/Button'

export default function StudyComplete({ deck, stats, onRestart, onExit }) {
  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return 'text-success'
    if (accuracy >= 75) return 'text-secondary'
    if (accuracy >= 60) return 'text-warning'
    return 'text-error'
  }

  const getAccuracyMessage = (accuracy) => {
    if (accuracy >= 90) return 'Excellent work! 🎉'
    if (accuracy >= 75) return 'Great job! 👏'
    if (accuracy >= 60) return 'Good effort! 👍'
    return 'Keep practicing! 💪'
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-surface rounded-xl border border-surface-light shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Trophy className="h-12 w-12 mx-auto mb-3" />
          </motion.div>
          <h1 className="text-xl font-bold mb-1">Study Session Complete!</h1>
          <p className="text-primary-100">{deck.title}</p>
        </div>

        {/* Stats */}
        <div className="p-6 space-y-6">
          {/* Accuracy */}
          <div className="text-center">
            <div className={`text-3xl font-bold ${getAccuracyColor(stats.accuracy)} mb-1`}>
              {stats.accuracy}%
            </div>
            <p className="text-text-secondary text-sm">{getAccuracyMessage(stats.accuracy)}</p>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-background rounded-lg border border-surface-light">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="text-lg font-semibold text-text-primary">
                {stats.correctAnswers}/{stats.cardsStudied}
              </div>
              <div className="text-xs text-text-secondary">Correct</div>
            </div>

            <div className="text-center p-3 bg-background rounded-lg border border-surface-light">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-5 w-5 text-secondary" />
              </div>
              <div className="text-lg font-semibold text-text-primary">
                {Math.floor(stats.totalTime / 60)}:{(stats.totalTime % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-text-secondary">Total Time</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-text-secondary">Cards studied:</span>
              <span className="text-text-primary font-medium">{stats.cardsStudied}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Average time per card:</span>
              <span className="text-text-primary font-medium">{stats.averageTime}s</span>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="bg-background rounded-lg p-4 border border-surface-light">
            <div className="flex items-center mb-2">
              <TrendingUp className="h-4 w-4 text-success mr-2" />
              <span className="text-sm font-medium text-text-primary">Study Streak</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-surface-light rounded-full h-2">
                <div 
                  className="bg-success h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.accuracy, 100)}%` }}
                />
              </div>
              <span className="text-xs text-text-secondary">
                {stats.accuracy >= 80 ? '+1' : 'Maintain'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={onRestart}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Study Again
            </Button>
            
            <Button
              onClick={onExit}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deck
            </Button>
          </div>

          {/* Motivational Message */}
          {stats.accuracy >= 80 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="text-center p-3 bg-success/10 border border-success/20 rounded-lg"
            >
              <p className="text-sm text-success">
                🔥 Great session! You're building strong knowledge foundations.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}