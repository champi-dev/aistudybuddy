import { motion } from 'framer-motion'

export default function StudyCard({ card, isFlipped, onFlip }) {
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