import clsx from 'clsx'
import type {
  AssetCheckoutStatus,
  AssetStatus,
  ExpenseStatus,
  FollowUpStatus,
  MembershipStatus,
  ProgramStatus,
  ProgramTaskStatus,
} from '../../types'

type StatusTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

const toneMap: Record<StatusTone, string> = {
  neutral: 'bg-canvas text-ink-muted',
  accent: 'bg-accent-light text-accent',
  success: 'bg-success-light text-success',
  warning: 'bg-warning-light text-warning',
  danger: 'bg-danger-light text-danger',
}

type StatusPillProps = {
  label: string
  tone?: StatusTone
}

export const StatusPill = ({ label, tone = 'neutral' }: StatusPillProps) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
      toneMap[tone],
    )}
  >
    {label.replace(/_/g, ' ')}
  </span>
)

export const getMembershipStatusTone = (status: MembershipStatus | string): StatusTone => {
  switch (status) {
    case 'member':
    case 'connected':
      return 'success'
    case 'new':
    case 'contacted':
      return 'accent'
    case 'follow_up':
      return 'warning'
    case 'inactive':
      return 'neutral'
    default:
      return 'neutral'
  }
}

export const getFollowUpStatusTone = (status: FollowUpStatus | string, isOverdue = false): StatusTone => {
  if (isOverdue && status !== 'completed') return 'danger'
  switch (status) {
    case 'open':
      return 'warning'
    case 'in_progress':
      return 'accent'
    case 'completed':
      return 'success'
    default:
      return 'neutral'
  }
}

export const getProgramStatusTone = (status: ProgramStatus | string): StatusTone => {
  switch (status) {
    case 'scheduled':
      return 'success'
    case 'draft':
      return 'warning'
    case 'completed':
      return 'neutral'
    case 'cancelled':
      return 'danger'
    default:
      return 'neutral'
  }
}

export const getMinistryActiveTone = (isActive: boolean): StatusTone =>
  isActive ? 'success' : 'neutral'

export const getConfirmationStatusTone = (status: string): StatusTone => {
  switch (status) {
    case 'confirmed':
      return 'success'
    case 'pending':
      return 'warning'
    case 'declined':
      return 'danger'
    default:
      return 'neutral'
  }
}

export const getAssetStatusTone = (status: AssetStatus | string): StatusTone => {
  switch (status) {
    case 'available':
      return 'success'
    case 'reserved':
    case 'in_use':
      return 'accent'
    case 'checked_out':
      return 'warning'
    case 'inspection':
    case 'maintenance':
      return 'warning'
    case 'returned':
      return 'neutral'
    case 'retired':
      return 'danger'
    default:
      return 'neutral'
  }
}

export const getAssetCheckoutStatusTone = (status: AssetCheckoutStatus | string): StatusTone => {
  switch (status) {
    case 'requested':
      return 'warning'
    case 'approved':
      return 'accent'
    case 'checked_out':
      return 'warning'
    case 'returned':
      return 'success'
    case 'cancelled':
      return 'danger'
    default:
      return 'neutral'
  }
}

export const getExpenseStatusTone = (status: ExpenseStatus | string): StatusTone => {
  switch (status) {
    case 'draft':
      return 'neutral'
    case 'submitted':
      return 'warning'
    case 'approved':
      return 'accent'
    case 'paid':
      return 'success'
    case 'reconciled':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'neutral'
  }
}

export const getProgramTaskStatusTone = (status: ProgramTaskStatus | string): StatusTone => {
  switch (status) {
    case 'todo':
      return 'neutral'
    case 'in_progress':
      return 'accent'
    case 'done':
      return 'success'
    case 'cancelled':
      return 'danger'
    default:
      return 'neutral'
  }
}
