import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Lightbulb, MessageCircle, CheckCircle, XCircle, Minus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQueryClient } from '@tanstack/react-query'
import Button from '../components/ui/Button'
import StudyCard from '../components/StudyCard'
import ProgressBar from '../components/ProgressBar'
import StudyComplete from '../components/StudyComplete'
import { useStartStudy, useSubmitAnswer, useGetHint, useCompleteStudy, useGetExplanation } from '../hooks/useStudy'
import { useDeck } from '../hooks/useDecks'
import toast from 'react-hot-toast'
import { cleanupInvalidDeckId } from '../config/testData'


export default function Study() {
  const { deckId: rawDeckId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  // Validate and clean deck ID
  const deckId = cleanupInvalidDeckId(rawDeckId)
  
  // Redirect if invalid deck ID
  useEffect(() => {
    if (!deckId) {
      toast.error('Invalid deck ID. Redirecting to dashboard...')
      navigate('/dashboard')
    }
  }, [deckId, navigate])
  
  // State
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
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

  const currentCard = cards && cards.length > 0 ? cards[currentCardIndex] : null
  const progress = cards && cards.length > 0 ? ((currentCardIndex + (isFlipped ? 1 : 0)) / cards.length) * 100 : 0

  // Start study session when component mounts
  useEffect(() => {
    if (deckId && !sessionData && !startStudyMutation.isPending) {
      startStudySession()
    }
  }, [deckId, sessionData])

  // Set card start time when card changes
  useEffect(() => {
    if (currentCard) {
      setCardStartTime(Date.now())
    }
  }, [currentCard])

  const startStudySession = async () => {
    try {
      const result = await startStudyMutation.mutateAsync({ deckId })
      console.log('Study session started:', result)
      
      if (result && result.session && result.cards) {
        setSessionData(result.session)
        setCards(result.cards)
        setStartTime(Date.now())
        setCardStartTime(Date.now())
      } else {
        console.error('Invalid response structure:', result)
        toast.error('Invalid session data received')
        navigate(`/decks/${deckId}`)
      }
    } catch (error) {
      console.error('Study session error:', error)
      toast.error(error.response?.data?.message || 'Failed to start study session')
      navigate(`/decks/${deckId}`)
    }
  }

  const flipCard = () => {
    setIsFlipped(true)
  }
  
  const handleSelectOption = (optionIndex) => {
    if (!isFlipped) {
      setSelectedOption(optionIndex)
    }
  }
  
  const submitQuizAnswer = async () => {
    if (selectedOption === null || !currentCard) return
    
    const isCorrect = selectedOption === currentCard.correct_option
    setIsFlipped(true)
    
    const timeSpent = Date.now() - cardStartTime
    
    try {
      await submitAnswerMutation.mutateAsync({
        sessionId: sessionData.id,
        cardId: currentCard.id,
        selectedOption,
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

      // Auto advance after a delay
      setTimeout(() => {
        nextCard()
      }, isCorrect ? 2000 : 3500)
    } catch (error) {
      toast.error('Failed to submit answer')
    }
  }

  const nextCard = () => {
    if (cards && currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
      setSelectedOption(null)
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
      
      // Invalidate analytics queries to refresh data
      queryClient.invalidateQueries(['analytics'])
      queryClient.invalidateQueries(['insights'])
      queryClient.invalidateQueries(['decks']) // Also refresh deck stats
    } catch (error) {
      toast.error('Failed to complete session')
      setSessionComplete(true) // Still show completion screen
      
      // Still invalidate queries even on error
      queryClient.invalidateQueries(['analytics'])
      queryClient.invalidateQueries(['insights'])
      queryClient.invalidateQueries(['decks'])
    }
  }

  const resetCard = () => {
    setIsFlipped(false)
    setSelectedOption(null)
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
  if (startStudyMutation.isPending || !sessionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Starting study session...</p>
        </div>
      </div>
    )
  }

  // No cards state
  if (!cards || cards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-primary text-lg mb-4">This deck has no cards</p>
          <Button onClick={() => navigate(`/decks/${deckId}`)}>
            Back to Deck
          </Button>
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
                  Card {currentCardIndex + 1} of {cards ? cards.length : 0}
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
            total={cards ? cards.length : 0} 
            progress={progress}
          />
        </div>
      </div>

      {/* Study Area */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Flashcard/Quiz Card */}
          <StudyCard
            card={currentCard}
            isFlipped={isFlipped}
            onFlip={flipCard}
            onSelectOption={handleSelectOption}
            selectedOption={selectedOption}
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
                {currentCard && currentCard.is_quiz ? (
                  // Quiz mode buttons
                  <>
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
                    
                    <Button 
                      onClick={submitQuizAnswer} 
                      disabled={selectedOption === null}
                      className="flex-1"
                    >
                      Submit Answer
                    </Button>
                  </>
                ) : (
                  // Flashcard mode buttons
                  <>
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
                  </>
                )}
              </div>
            ) : (
              currentCard && currentCard.is_quiz ? (
                // Quiz mode - auto advancing, show next button
                <div className="text-center">
                  <p className="text-text-secondary text-sm mb-3">
                    Answer submitted! Moving to next question...
                  </p>
                </div>
              ) : (
                // Flashcard mode - self evaluation
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
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}