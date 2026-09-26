import clsx from 'clsx'
import type { ReactNode } from 'react'

type TableProps = {
  children: ReactNode
  className?: string
}

export const Table = ({ children, className }: TableProps) => (
  <div className="panel overflow-x-auto">
    <table className={clsx('w-full min-w-full text-left text-sm', className)}>
      {children}
    </table>
  </div>
)

type TableHeaderProps = {
  children: ReactNode
}

export const TableHeader = ({ children }: TableHeaderProps) => (
  <thead className="border-b border-border bg-canvas-elevated/80">
    <tr>{children}</tr>
  </thead>
)

type TableHeadProps = {
  children: ReactNode
  className?: string
}

export const TableHead = ({ children, className }: TableHeadProps) => (
  <th
    scope="col"
    className={clsx('px-4 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] text-ink-subtle', className)}
  >
    {children}
  </th>
)

type TableBodyProps = {
  children: ReactNode
}

export const TableBody = ({ children }: TableBodyProps) => (
  <tbody className="divide-y divide-border">{children}</tbody>
)

type TableRowProps = {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export const TableRow = ({ children, onClick, className }: TableRowProps) => (
  <tr
    className={clsx(
      'transition-colors',
      onClick && 'cursor-pointer hover:bg-accent-light/40',
      !onClick && 'hover:bg-surface-hover/50',
      className,
    )}
    onClick={onClick}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onClick()
      }
    } : undefined}
    role={onClick ? 'button' : undefined}
  >
    {children}
  </tr>
)

type TableCellProps = {
  children: ReactNode
  className?: string
}

export const TableCell = ({ children, className }: TableCellProps) => (
  <td className={clsx('px-4 py-3.5 text-ink', className)}>{children}</td>
)
