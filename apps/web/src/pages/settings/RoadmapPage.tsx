import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'

type RoadmapItem = {
  title: string
  description: string
}

const nowItems: RoadmapItem[] = [
  {
    title: 'Member registry & registration',
    description: 'Register people with phone/email duplicate checks and membership lifecycle status.',
  },
  {
    title: 'Households',
    description: 'Group people into families for shared contact and pastoral context.',
  },
  {
    title: 'Follow-up queue',
    description: 'Assign owners, track open / in-progress / completed, and surface overdue actions.',
  },
  {
    title: 'Ministry & serving',
    description: 'Manage ministries, roles, availability, and team memberships.',
  },
  {
    title: 'Programs & attendance',
    description: 'Create programs, assign teams, and record present / absent / excused / visitor.',
  },
  {
    title: 'Roles, activity log & dashboard',
    description: 'RBAC foundation, audit trail, and operational KPI counts from real workflows.',
  },
  {
    title: 'Asset management',
    description: 'Track cameras, mics, and other equipment with checkout / return lifecycle.',
  },
  {
    title: 'Expense requests',
    description: 'Draft → submitted → approved → paid operational expense workflow.',
  },
  {
    title: 'Program operations',
    description: 'Budgets, tasks, and documents inside each program workspace.',
  },
  {
    title: 'In-app notifications',
    description: 'Operational alerts for follow-ups, checkouts, and expenses.',
  },
  {
    title: 'Announcements',
    description: 'In-app broadcasts for everyone, staff, or members — with publish workflow.',
  },
  {
    title: 'Giving & tithes',
    description: 'Finance-role only giving ledger, kept off general member profiles.',
  },
  {
    title: 'Member portal',
    description: 'Self-service profile, serving confirmations, and program RSVPs.',
  },
  {
    title: 'Reports & intelligence',
    description: 'Membership growth, attendance, follow-up health, ministry depth, and giving trends.',
  },
]

const nextItems: RoadmapItem[] = [
  {
    title: 'Email / SMS communications',
    description: 'Reminders and announcements through external channels.',
  },
]

const laterItems: RoadmapItem[] = [
  {
    title: 'AI assistant',
    description: 'Natural-language ops helpers on structured church data.',
  },
  {
    title: 'Multi-campus',
    description: 'Support multiple campuses or churches in one Halwot Ops deployment.',
  },
]

type RoadmapColumnProps = {
  label: string
  badgeVariant: 'accent' | 'warning' | 'default'
  items: RoadmapItem[]
}

const RoadmapColumn = ({ label, badgeVariant, items }: RoadmapColumnProps) => (
  <div className="rounded-lg border border-border bg-surface">
    <div className="border-b border-border px-4 py-3">
      <Badge variant={badgeVariant}>{label}</Badge>
    </div>
    <ul className="divide-y divide-border">
      {items.map((item) => (
        <li key={item.title} className="px-4 py-4">
          <h3 className="text-sm font-medium text-ink">{item.title}</h3>
          <p className="mt-1 text-sm text-ink-muted">{item.description}</p>
        </li>
      ))}
    </ul>
  </div>
)

export const RoadmapPage = () => (
  <div>
    <PageHeader
      title="Product roadmap"
      description="Scope control for Halwot Ops — what ships now, next, and later"
    />
    <div className="grid gap-4 lg:grid-cols-3">
      <RoadmapColumn label="Now" badgeVariant="accent" items={nowItems} />
      <RoadmapColumn label="Next" badgeVariant="warning" items={nextItems} />
      <RoadmapColumn label="Later" badgeVariant="default" items={laterItems} />
    </div>
  </div>
)
