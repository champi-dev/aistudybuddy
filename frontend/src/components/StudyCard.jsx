import { motion } from 'framer-motion'
import { CheckCircle } from 'lucide-react'

export default function StudyCard({ card, isFlipped, onFlip, onSelectOption, selectedOption }) {
  // Quiz mode - show multiple choice options
  if (card.is_quiz && card.options) {
    const options = typeof card.options === 'string' ? JSON.parse(card.options) : card.options;
    
    return (
      <div className="w-full">
        <div className="bg-surface border border-surface-light rounded-xl shadow-lg p-8">
          {/* Question */}
          <div className="mb-6">
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Question
              </span>
            </div>
            <h2 className="text-xl font-medium text-text-primary leading-relaxed">
              {card.front}
            </h2>
          </div>
          
          {/* Options */}
          <div className="space-y-3">
            {options.map((option, index) => {
              const isSelected = selectedOption === index;
              const isCorrect = card.correct_option === index;
              const showResult = isFlipped;
              
              return (
                <motion.button
                  key={index}
                  onClick={() => !isFlipped && onSelectOption(index)}
                  disabled={isFlipped}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showResult && isCorrect
                      ? 'bg-success/10 border-success text-text-primary'
                      : showResult && isSelected && !isCorrect
                      ? 'bg-error/10 border-error text-text-primary'
                      : isSelected
                      ? 'bg-primary/10 border-primary text-text-primary'
                      : 'bg-background border-surface-light hover:bg-surface-light text-text-primary hover:border-primary/50'
                  } ${isFlipped ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  whileHover={!isFlipped ? { scale: 1.02 } : {}}
                  whileTap={!isFlipped ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full mr-3 font-medium text-sm ${
                        showResult && isCorrect
                          ? 'bg-success text-white'
                          : showResult && isSelected && !isCorrect
                          ? 'bg-error text-white'
                          : isSelected
                          ? 'bg-primary text-white'
                          : 'bg-surface-light text-text-secondary'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="text-base">{option}</span>
                    </div>
                    {showResult && isCorrect && (
                      <CheckCircle className="h-5 w-5 text-success" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
          
          {/* Result message */}
          {isFlipped && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-lg bg-surface-light"
            >
              <div className="text-text-primary">
                {selectedOption === card.correct_option ? (
                  <div className="flex items-center text-success">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Correct!</span>
                  </div>
                ) : (
                  <div>
                    <div className="text-error font-medium mb-2">Not quite right.</div>
                    <div className="text-text-secondary text-sm">
                      The correct answer is: <span className="font-medium">{options[card.correct_option]}</span>
                    </div>
                  </div>
                )}
                {card.back && (
                  <div className="mt-3 pt-3 border-t border-surface">
                    <div className="text-sm text-text-secondary">Explanation:</div>
                    <div className="text-text-primary mt-1">{card.back}</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Difficulty indicator */}
          {card.difficulty && (
            <div className="mt-6 flex items-center text-text-secondary text-sm">
              <span>Difficulty: </span>
              <div className="flex ml-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`w-2 h-2 rounded-full mr-1 ${
                      level <= card.difficulty ? 'bg-secondary' : 'bg-surface'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Flashcard mode - original flip card
  return (
    <div className="perspective-1000 cursor-pointer" onClick={onFlip}>
      <motion.div
        className="relative w-full h-96 preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Front of card */}
        <div className="card-face front absolute inset-0 w-full h-full backface-hidden bg-surface border border-surface-light rounded-xl shadow-lg">
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Question
              </span>
            </div>
            <h2 className="text-xl font-medium text-text-primary leading-relaxed">
              {card.front}
            </h2>
            <div className="mt-6 text-text-secondary text-sm">
              Click to reveal answer
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div 
          className="card-face back absolute inset-0 w-full h-full backface-hidden bg-surface-light border border-surface-light rounded-xl shadow-lg"
          style={{ transform: 'rotateY(180deg)' }}
        >
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                Answer
              </span>
            </div>
            <div className="text-lg text-text-primary leading-relaxed">
              {card.back}
            </div>
            {card.difficulty && (
              <div className="mt-6 flex items-center text-text-secondary text-sm">
                <span>Difficulty: </span>
                <div className="flex ml-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`w-2 h-2 rounded-full mr-1 ${
                        level <= card.difficulty ? 'bg-secondary' : 'bg-surface'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}