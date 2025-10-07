import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Lightbulb, MessageCircle, CheckCircle, XCircle, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from '../components/ui/Button'
import StudyCard from '../components/StudyCard'
import ProgressBar from '../components/ProgressBar'
import StudyComplete from '../components/StudyComplete'
import { useStartStudy, useSubmitAnswer, useGetHint, useCompleteStudy, useGetExplanation } from '../hooks/useStudy'
import { useDeck } from '../hooks/useDecks'
import toast from 'react-hot-toast'


export default function Study() {
  const { deckId } = useParams()
  const navigate = useNavigate()
  
  // State
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [currentHints, setCurrentHints] = useState([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [aiExplanation, setAiExplanation] = useState('')
  const [sessionData, setSessionData] = useState(null)
  const [cards, setCards] = useState([])
  const [sessionComplete, setSessionComplete] = useState(false)
  const [answers, setAnswers] = useState([])
  const [startTime, setStartTime] = useState(null)
  const [cardStartTime, setCardStartTime] = useState(null)

  // API hooks
  const { data: deck } = useDeck(deckId)
  const startStudyMutation = useStartStudy()
  const submitAnswerMutation = useSubmitAnswer()
  const getHintMutation = useGetHint()
  const completeStudyMutation = useCompleteStudy()
  const getExplanationMutation = useGetExplanation()

  const currentCard = cards[currentCardIndex]
  const progress = cards.length > 0 ? ((currentCardIndex + (isFlipped ? 1 : 0)) / cards.length) * 100 : 0

  // Start study session when component mounts
  useEffect(() => {
    if (deckId && !sessionData) {
      startStudySession()
    }
  }, [deckId])

  // Set card start time when card changes
  useEffect(() => {
    if (currentCard) {
      setCardStartTime(Date.now())
    }
  }, [currentCard])

  const startStudySession = async () => {
    try {
      const result = await startStudyMutation.mutateAsync(deckId)
      setSessionData(result.session)
      setCards(result.cards)
      setStartTime(Date.now())
      setCardStartTime(Date.now())
    } catch (error) {
      toast.error('Failed to start study session')
      navigate(`/decks/${deckId}`)
    }
  }

  const flipCard = () => {
    setIsFlipped(true)
  }

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
      setHintsUsed(0)
      setCurrentHints([])
      setShowExplanation(false)
      setAiExplanation('')
    } else {
      completeSession()
    }
  }

  const handleAnswer = async (isCorrect) => {
    if (!sessionData || !currentCard) return

    const timeSpent = Date.now() - cardStartTime
    
    try {
      const result = await submitAnswerMutation.mutateAsync({
        sessionId: sessionData.id,
        cardId: currentCard.id,
        isCorrect,
        timeSpent,
        hintsUsed
      })

      setAnswers([...answers, {
        cardId: currentCard.id,
        isCorrect,
        hintsUsed,
        timeSpent
      }])

      // Show AI explanation if incorrect
      if (!isCorrect && result.aiExplanation) {
        setAiExplanation(result.aiExplanation)
        setShowExplanation(true)
      }

      // Auto advance after a delay
      setTimeout(() => {
        nextCard()
      }, isCorrect ? 1000 : 3000)
    } catch (error) {
      toast.error('Failed to submit answer')
    }
  }

  const completeSession = async () => {
    if (!sessionData) return

    try {
      const result = await completeStudyMutation.mutateAsync(sessionData.id)
      setSessionComplete(true)
    } catch (error) {
      toast.error('Failed to complete session')
      setSessionComplete(true) // Still show completion screen
    }
  }

  const resetCard = () => {
    setIsFlipped(false)
    setHintsUsed(0)
    setCurrentHints([])
    setShowExplanation(false)
    setAiExplanation('')
    setCardStartTime(Date.now())
  }

  const showNextHint = async () => {
    if (!currentCard || hintsUsed >= 3) return

    const nextLevel = hintsUsed + 1
    
    try {
      const result = await getHintMutation.mutateAsync({
        cardId: currentCard.id,
        level: nextLevel
      })

      setCurrentHints([...currentHints, result.hint])
      setHintsUsed(nextLevel)
    } catch (error) {
      toast.error('Failed to get hint')
    }
  }

  const exitStudy = () => {
    navigate(`/decks/${deckId}`)
  }

  // Loading state
  if (startStudyMutation.isPending || !cards.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Starting study session...</p>
        </div>
      </div>
    )
  }

  if (sessionComplete) {
    const correctAnswers = answers.filter(a => a.isCorrect).length
    const accuracy = answers.length > 0 ? Math.round((correctAnswers / answers.length) * 100) : 0
    const totalTime = startTime ? Math.round((Date.now() - startTime) / 1000) : 0
    
    return (
      <StudyComplete
        deck={deck || { title: 'Study Session', id: deckId }}
        stats={{
          cardsStudied: answers.length,
          correctAnswers,
          accuracy,
          totalTime,
          averageTime: answers.length > 0 ? Math.round(totalTime / answers.length) : 0
        }}
        onRestart={() => {
          setCurrentCardIndex(0)
          setIsFlipped(false)
          setSessionComplete(false)
          setAnswers([])
          setSessionData(null)
          startStudySession()
        }}
        onExit={exitStudy}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-surface-light bg-surface">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={exitStudy}
                className="mr-4 p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-light"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-text-primary">{deck?.title || 'Study Session'}</h1>
                <p className="text-sm text-text-secondary">
                  Card {currentCardIndex + 1} of {cards.length}
                </p>
              </div>
            </div>
            
            <Button variant="outline" size="sm" onClick={resetCard}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          
          <ProgressBar 
            current={currentCardIndex} 
            total={cards.length} 
            progress={progress}
          />
        </div>
      </div>

      {/* Study Area */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Flashcard */}
          <StudyCard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={flipCard}
          />

          {/* Hint Display */}
          <AnimatePresence>
            {currentHints.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-secondary/10 border border-secondary/20 rounded-lg p-4"
              >
                <div className="flex items-start">
                  <Lightbulb className="h-5 w-5 text-secondary mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-text-primary mb-1">
                      Hint {hintsUsed} of 3
                    </h3>
                    <p className="text-text-secondary">
                      {currentHints[currentHints.length - 1]}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Explanation Display */}
          <AnimatePresence>
            {showExplanation && aiExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-primary/10 border border-primary/20 rounded-lg p-4"
              >
                <div className="flex items-start">
                  <MessageCircle className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-text-primary mb-1">AI Explanation</h3>
                    <p className="text-text-secondary">
                      {aiExplanation}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="space-y-4">
            {!isFlipped ? (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={showNextHint}
                  disabled={getHintMutation.isPending || hintsUsed >= 3}
                  className="flex-1"
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  {getHintMutation.isPending 
                    ? 'Getting hint...'
                    : hintsUsed === 0 
                    ? 'Get Hint' 
                    : `Next Hint (${hintsUsed}/3)`
                  }
                </Button>
                
                <Button onClick={flipCard} className="flex-1">
                  Show Answer
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-text-secondary text-sm">
                  How well did you know this?
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="error"
                    onClick={() => handleAnswer(false)}
                    disabled={submitAnswerMutation.isPending}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Incorrect
                  </Button>
                  
                  <Button
                    variant="warning"
                    onClick={() => handleAnswer(false)}
                    disabled={submitAnswerMutation.isPending}
                    className="flex-1"
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Partial
                  </Button>
                  
                  <Button
                    variant="success"
                    onClick={() => handleAnswer(true)}
                    disabled={submitAnswerMutation.isPending}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Correct
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}