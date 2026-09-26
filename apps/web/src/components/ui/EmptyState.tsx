import type { ReactNode } from 'react'

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
    <h3 className="text-base font-medium text-ink">{title}</h3>
    {description && (
      <p className="mt-2 max-w-sm text-sm text-ink-muted">{description}</p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
)
