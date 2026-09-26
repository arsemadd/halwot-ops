export type User = {
  id: number
  organization_id?: number
  name: string
  email: string
  roles?: string[]
  permissions?: string[]
}

export type Role = {
  id: number
  name: string
  permissions: string[]
}

export type MembershipStatus =
  | 'new'
  | 'contacted'
  | 'follow_up'
  | 'connected'
  | 'member'
  | 'inactive'

export type Person = {
  id: number
  full_name: string
  preferred_name?: string | null
  gender?: string | null
  date_of_birth?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  first_contact_date?: string | null
  membership_status: MembershipStatus
  membership_date?: string | null
  baptism_status?: string | null
  pastoral_notes?: string | null
  household_id?: number | null
  household?: Household | null
  archived_at?: string | null
  created_at?: string
  updated_at?: string
}

export type HouseholdMember = Person & {
  pivot?: {
    role: 'head' | 'spouse' | 'child' | 'other'
  }
}

export type Household = {
  id: number
  name: string
  address?: string | null
  phone?: string | null
  emergency_contact?: string | null
  notes?: string | null
  members?: HouseholdMember[]
  members_count?: number
  created_at?: string
  updated_at?: string
}

export type FollowUpStatus = 'open' | 'in_progress' | 'completed'

export type FollowUp = {
  id: number
  person_id: number
  person?: Person | null
  owner_user_id?: number | null
  owner?: User | null
  status: FollowUpStatus
  last_contact_at?: string | null
  next_action_at?: string | null
  notes?: string | null
  is_overdue?: boolean
  created_at?: string
  updated_at?: string
}

export type Ministry = {
  id: number
  name: string
  slug?: string | null
  description?: string | null
  leader_person_id?: number | null
  leader?: Person | null
  is_active: boolean
  memberships?: MinistryMembership[]
  memberships_count?: number
  created_at?: string
  updated_at?: string
}

export type MinistryMembershipStatus = 'active' | 'inactive'

export type MinistryMembership = {
  id: number
  ministry_id: number
  ministry?: Ministry | null
  person_id: number
  person?: Person | null
  role?: string | null
  availability?: string | null
  status: MinistryMembershipStatus
  created_at?: string
  updated_at?: string
}

export type ProgramStatus = 'draft' | 'scheduled' | 'completed' | 'cancelled'

export type Program = {
  id: number
  ministry_id?: number | null
  ministry?: Ministry | null
  title: string
  description?: string | null
  starts_at?: string | null
  location?: string | null
  leader_person_id?: number | null
  leader?: Person | null
  status: ProgramStatus
  assignments?: ProgramAssignment[]
  attendance_records?: AttendanceRecord[]
  created_at?: string
  updated_at?: string
}

export type ConfirmationStatus = 'pending' | 'confirmed' | 'declined'

export type ProgramAssignment = {
  id: number
  program_id: number
  person_id: number
  person?: Person | null
  role: string
  confirmation_status: ConfirmationStatus
  created_at?: string
  updated_at?: string
}

export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'visitor'

export type AttendanceRecord = {
  id: number
  program_id: number
  person_id: number
  person?: Person | null
  status: AttendanceStatus
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export type UpcomingProgram = {
  id: number
  title: string
  starts_at?: string | null
  location?: string | null
  status: ProgramStatus
  serving_count?: number
}

export type DashboardAttention = {
  type: string
  count: number
  title: string
  message: string
  link: string
  follow_up_id?: number
}

export type DashboardFollowUpItem = {
  id: number
  person_id: number
  person_name?: string | null
  preferred_name?: string | null
  reason: string
  status: FollowUpStatus
  next_action_at?: string | null
  is_overdue: boolean
  due_today: boolean
  days_overdue?: number | null
}

export type MemberGrowthPoint = {
  month: string
  label: string
  count: number
}

export type DashboardActivityItem = {
  id: number
  action: string
  description?: string | null
  created_at: string
  user_name?: string | null
  tone?: 'success' | 'accent' | 'neutral'
}

export type DashboardData = {
  members: number
  total_people?: number
  new_this_month: number
  active_volunteers: number
  programs_this_month: number
  next_program_title?: string | null
  open_follow_ups: number
  overdue_follow_ups: number
  attention?: DashboardAttention | null
  priority_follow_ups?: DashboardFollowUpItem[]
  member_growth?: MemberGrowthPoint[]
  upcoming_programs: UpcomingProgram[]
  recent_activity?: DashboardActivityItem[]
  pending_expenses?: number
  assets_checked_out?: number
  open_asset_requests?: number
}

export type AssetStatus =
  | 'available'
  | 'reserved'
  | 'checked_out'
  | 'in_use'
  | 'returned'
  | 'inspection'
  | 'maintenance'
  | 'retired'

export type AssetCondition = 'excellent' | 'good' | 'fair' | 'poor'

export type AssetLocation = {
  id: number
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export type Asset = {
  id: number
  code: string
  name: string
  category: string
  brand?: string | null
  model?: string | null
  status: AssetStatus
  condition: AssetCondition
  location_id?: number | null
  location?: AssetLocation | null
  custodian_ministry_id?: number | null
  custodian_ministry?: Ministry | null
  purchase_date?: string | null
  purchase_value?: string | null
  currency?: string | null
  notes?: string | null
  checkouts?: AssetCheckout[]
  created_at?: string
  updated_at?: string
}

export type AssetCheckoutStatus =
  | 'requested'
  | 'approved'
  | 'checked_out'
  | 'returned'
  | 'cancelled'

export type AssetCheckout = {
  id: number
  asset_id: number
  asset?: Asset | null
  requested_by_user_id: number
  requested_by?: User | null
  program_id?: number | null
  program?: Program | null
  approved_by_user_id?: number | null
  approved_by?: User | null
  status: AssetCheckoutStatus
  purpose?: string | null
  expected_return_at?: string | null
  checked_out_at?: string | null
  returned_at?: string | null
  return_condition?: AssetCondition | null
  return_notes?: string | null
  created_at?: string
  updated_at?: string
}

export type ExpenseStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'paid'
  | 'reconciled'
  | 'rejected'

export type Expense = {
  id: number
  category: string
  program_id?: number | null
  program?: Program | null
  ministry_id?: number | null
  ministry?: Ministry | null
  amount: string
  currency: string
  description: string
  status: ExpenseStatus
  requested_by_user_id: number
  requested_by?: User | null
  approved_by_user_id?: number | null
  approved_by?: User | null
  paid_by_user_id?: number | null
  paid_by?: User | null
  receipt_path?: string | null
  submitted_at?: string | null
  approved_at?: string | null
  paid_at?: string | null
  rejection_reason?: string | null
  created_at?: string
  updated_at?: string
}

export type ProgramTaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'

export type ProgramBudget = {
  id: number
  program_id: number
  category: string
  amount: string
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export type ProgramTask = {
  id: number
  program_id: number
  title: string
  description?: string | null
  assignee_person_id?: number | null
  assignee?: Person | null
  status: ProgramTaskStatus
  due_at?: string | null
  created_at?: string
  updated_at?: string
}

export type ProgramDocument = {
  id: number
  program_id: number
  title: string
  description?: string | null
  file_path?: string | null
  uploaded_by_user_id?: number | null
  uploaded_by?: User | null
  created_at?: string
  updated_at?: string
}

export type ActivityLog = {
  id: number
  action: string
  description?: string | null
  user_id?: number | null
  user?: User | null
  subject_type?: string | null
  subject_id?: number | null
  properties?: Record<string, unknown> | null
  created_at: string
}

export type AppNotification = {
  id: number
  organization_id?: number
  user_id?: number | null
  title: string
  body?: string | null
  link?: string | null
  read_at?: string | null
  created_at: string
  updated_at?: string
}

export type Organization = {
  id: number
  name: string
  slug?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  settings?: Record<string, unknown> | null
}

export type DuplicateCheckResult = {
  duplicates: Person[]
  has_duplicates: boolean
}

export const getPersonDisplayName = (person: Pick<Person, 'full_name' | 'preferred_name'>) =>
  person.preferred_name || person.full_name
