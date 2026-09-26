import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  children: ReactNode
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) => (
  <button
    type="button"
    disabled={disabled || isLoading}
    className={clsx(
      'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50',
      {
        'bg-accent text-white hover:bg-accent-hover': variant === 'primary',
        'border border-border bg-surface text-ink hover:bg-canvas': variant === 'secondary',
        'text-ink-muted hover:bg-canvas hover:text-ink': variant === 'ghost',
        'bg-danger text-white hover:bg-danger/90': variant === 'danger',
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-4 py-2 text-sm': size === 'md',
        'px-5 py-2.5 text-base': size === 'lg',
      },
      className,
    )}
    {...props}
  >
    {isLoading ? 'Loading…' : children}
  </button>
)
