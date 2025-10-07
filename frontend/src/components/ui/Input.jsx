import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Input = forwardRef(({
  className,
  type = 'text',
  label,
  error,
  helperText,
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={clsx(
          'block w-full rounded-lg border px-3 py-2 text-sm',
          'bg-background text-text-primary placeholder:text-text-secondary',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary',
          error
            ? 'border-error focus:ring-error focus:border-error'
            : 'border-surface-light hover:border-gray-600',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-text-secondary">{helperText}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input