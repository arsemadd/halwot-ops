import clsx from 'clsx'
import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger'

type BadgeProps = {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export const Badge = ({ children, variant = 'default', className }: BadgeProps) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      {
        'bg-canvas text-ink-muted': variant === 'default',
        'bg-accent-light text-accent': variant === 'accent',
        'bg-success-light text-success': variant === 'success',
        'bg-warning-light text-warning': variant === 'warning',
        'bg-danger-light text-danger': variant === 'danger',
      },
      className,
    )}
  >
    {children}
  </span>
)
