import { motion } from 'framer-motion'

export default function ProgressBar({ current, total, progress }) {
  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm text-text-secondary mb-2">
        <span>Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      
      <div className="w-full bg-surface-light rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-text-secondary mt-1">
        <span>Card {current + 1}</span>
        <span>{total} total</span>
      </div>
    </div>
  )
}