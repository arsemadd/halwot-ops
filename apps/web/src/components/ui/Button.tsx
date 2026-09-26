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
      'inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50',
      {
        'rounded-full bg-accent text-white shadow-[0_8px_24px_rgba(244,121,32,0.35)] hover:bg-accent-hover hover:shadow-[0_10px_28px_rgba(244,121,32,0.45)]':
          variant === 'primary',
        'rounded-full border border-border-strong bg-surface text-ink hover:border-accent/50 hover:bg-surface-hover':
          variant === 'secondary',
        'rounded-full text-ink-muted hover:bg-accent-light hover:text-ink': variant === 'ghost',
        'rounded-full bg-danger text-white hover:brightness-110': variant === 'danger',
        'px-3.5 py-1.5 text-sm': size === 'sm',
        'px-5 py-2 text-sm': size === 'md',
        'px-6 py-2.5 text-base': size === 'lg',
      },
      className,
    )}
    {...props}
  >
    {isLoading ? 'Loading…' : children}
  </button>
)
