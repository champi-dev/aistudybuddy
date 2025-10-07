import { forwardRef } from 'react'
import { clsx } from 'clsx'

const Button = forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  disabled,
  children,
  as: Component = 'button',
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-primary hover:bg-primary-dark text-white border-transparent',
    secondary: 'bg-secondary hover:bg-secondary/90 text-white border-transparent',
    outline: 'bg-transparent hover:bg-surface-light text-text-primary border-surface-light',
    ghost: 'bg-transparent hover:bg-surface-light text-text-primary border-transparent',
    success: 'bg-success hover:bg-success/90 text-white border-transparent',
    error: 'bg-error hover:bg-error/90 text-white border-transparent',
    warning: 'bg-warning hover:bg-warning/90 text-white border-transparent'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  return (
    <Component
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center rounded-lg border font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </Component>
  )
})

Button.displayName = 'Button'

export default Button