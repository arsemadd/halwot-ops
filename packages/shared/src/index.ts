/** Shared domain types for Halwot Ops (Phase 1) */

export type MembershipStatus =
  | 'new'
  | 'contacted'
  | 'follow_up'
  | 'connected'
  | 'member'
  | 'inactive'

export type FollowUpStatus = 'open' | 'in_progress' | 'completed'

export type ProgramStatus = 'draft' | 'scheduled' | 'completed' | 'cancelled'

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'visitor'

export type ConfirmationStatus = 'pending' | 'confirmed' | 'declined'

export const MEMBERSHIP_STATUSES: MembershipStatus[] = [
  'new',
  'contacted',
  'follow_up',
  'connected',
  'member',
  'inactive',
]

export const FOLLOW_UP_STATUSES: FollowUpStatus[] = [
  'open',
  'in_progress',
  'completed',
]

export const PROGRAM_STATUSES: ProgramStatus[] = [
  'draft',
  'scheduled',
  'completed',
  'cancelled',
]
