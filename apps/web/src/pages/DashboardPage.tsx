import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { unwrapData } from '../lib/unwrap'
import { PageHeader } from '../components/ui/PageHeader'
import { getProgramStatusTone, StatusPill } from '../components/ui/StatusPill'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table'
import type { DashboardData } from '../types'

const fetchDashboard = async (): Promise<DashboardData> => {
  const { data } = await api.get('/api/v1/dashboard')
  return unwrapData<DashboardData>(data)
}

const kpiCards = [
  { key: 'members' as const, label: 'Members', href: '/people/members?status=member' },
  { key: 'new_this_month' as const, label: 'New this month', href: '/people/members?status=new' },
  { key: 'active_volunteers' as const, label: 'Active volunteers', href: '/ministry/serving' },
  { key: 'programs_this_month' as const, label: 'Programs this month', href: '/programs' },
  { key: 'open_follow_ups' as const, label: 'Open follow-ups', href: '/people/follow-ups' },
  { key: 'overdue_follow_ups' as const, label: 'Overdue follow-ups', href: '/people/follow-ups?overdue=1' },
  { key: 'pending_expenses' as const, label: 'Pending expenses', href: '/operations/expenses?status=submitted' },
  { key: 'assets_checked_out' as const, label: 'Assets checked out', href: '/operations/assets?status=checked_out' },
  { key: 'open_asset_requests' as const, label: 'Open asset requests', href: '/operations/checkouts?status=requested' },
]

export const DashboardPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  })

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Live operational pulse across people, ministries, programs, and resources"
      />
      {isLoading && (
        <p className="text-sm text-ink-muted">Loading dashboard…</p>
      )}
      {isError && (
        <p className="text-sm text-danger">Unable to load dashboard data.</p>
      )}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpiCards
              .filter((card) => {
                const isOpsKpi = card.key === 'pending_expenses'
                  || card.key === 'assets_checked_out'
                  || card.key === 'open_asset_requests'
                if (isOpsKpi) return data[card.key] !== undefined
                return true
              })
              .map((card) => (
                <Link
                  key={card.key}
                  to={card.href}
                  className="kpi-card p-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
                    {card.label}
                  </p>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-ink">
                    {data[card.key] ?? '—'}
                  </p>
                  <p className="mt-3 text-xs font-medium text-accent">View details →</p>
                </Link>
              ))}
          </div>
          {data.upcoming_programs && data.upcoming_programs.length > 0 && (
            <div className="mt-10">
              <div className="mb-4 flex items-end justify-between">
                <h2 className="text-xl font-bold text-ink">Upcoming programs</h2>
                <Link to="/programs" className="text-sm font-medium text-accent hover:text-accent-hover">
                  All programs
                </Link>
              </div>
              <Table>
                <TableHeader>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                </TableHeader>
                <TableBody>
                  {data.upcoming_programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell>
                        <Link to={`/programs/${program.id}`} className="font-semibold text-accent hover:text-accent-hover">
                          {program.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {program.starts_at
                          ? new Date(program.starts_at).toLocaleString()
                          : '—'}
                      </TableCell>
                      <TableCell>{program.location || '—'}</TableCell>
                      <TableCell>
                        <StatusPill label={program.status} tone={getProgramStatusTone(program.status)} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
