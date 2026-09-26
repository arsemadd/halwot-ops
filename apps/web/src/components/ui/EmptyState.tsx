import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="panel flex flex-col items-center justify-center border-dashed px-6 py-16 text-center">
    <div className="mb-4 h-10 w-10 rounded-full bg-accent-light ring-1 ring-accent/30" />
    <h3 className="text-base font-semibold text-ink">{title}</h3>
    {description && (
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
)
