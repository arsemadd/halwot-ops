import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { unwrapData } from '../../lib/unwrap'
import { PageHeader } from '../../components/ui/PageHeader'
import type { ChurchReports } from '../../types'

const fetchReports = async (): Promise<ChurchReports> => {
  const { data } = await api.get('/api/v1/reports')
  return unwrapData<ChurchReports>(data)
}

const BarChart = ({
  points,
  valueKey = 'count',
}: {
  points: Array<{ label: string; count?: number; total?: string }>
  valueKey?: 'count' | 'total'
}) => {
  const values = points.map((p) =>
    valueKey === 'total' ? Number(p.total || 0) : Number(p.count || 0),
  )
  const max = Math.max(...values, 1)

  return (
    <div className="flex h-36 items-end gap-2">
      {points.map((point, index) => {
        const value = values[index]
        return (
          <div key={point.label + index} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-accent/85"
              style={{ height: `${Math.max(6, (value / max) * 100)}%` }}
              title={String(value)}
            />
            <span className="text-[10px] text-ink-subtle">{point.label}</span>
          </div>
        )
      })}
    </div>
  )
}

const formatAmount = (amount: string, currency = 'ETB') =>
  `${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0 })} ${currency}`

export const ReportsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchReports,
  })

  if (isLoading || !data) {
    return <p className="text-sm text-ink-muted">Loading church intelligence…</p>
  }

  const statusEntries = Object.entries(data.people.by_status || {})

  return (
    <div>
      <PageHeader
        title="Reports & intelligence"
        description="Operational trends across people, attendance, follow-up, and ministry"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'People', value: data.people.total },
          { label: 'Members', value: data.people.members },
          { label: 'Volunteers', value: data.people.volunteers },
          { label: 'Programs this month', value: data.programs.this_month },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-ink">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Member growth</h2>
          <p className="mt-1 text-xs text-ink-muted">Cumulative people over the last 6 months</p>
          <div className="mt-4">
            <BarChart points={data.people.growth} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Attendance (present + visitors)</h2>
          <p className="mt-1 text-xs text-ink-muted">Recorded attendance by program month</p>
          <div className="mt-4">
            <BarChart points={data.attendance.by_month} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Membership mix</h2>
          <ul className="mt-4 space-y-2">
            {statusEntries.map(([status, count]) => (
              <li
                key={status}
                className="flex items-center justify-between rounded-xl bg-canvas px-3 py-2 text-sm"
              >
                <span className="capitalize text-ink">{status.replace('_', ' ')}</span>
                <span className="font-semibold text-ink">{count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Follow-up health</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(
              [
                ['Open', data.follow_ups.open],
                ['In progress', data.follow_ups.in_progress],
                ['Completed', data.follow_ups.completed],
                ['Overdue', data.follow_ups.overdue],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="rounded-xl bg-canvas px-3 py-3">
                <p className="text-xs text-ink-muted">{label}</p>
                <p
                  className={`mt-1 text-xl font-semibold ${
                    label === 'Overdue' && value > 0 ? 'text-danger' : 'text-ink'
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Ministry serving depth</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {data.ministries.map((ministry) => (
              <div key={ministry.id} className="rounded-xl bg-canvas px-3 py-3">
                <p className="text-sm font-medium text-ink">{ministry.name}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {ministry.active_count} active{' '}
                  {ministry.active_count === 1 ? 'volunteer' : 'volunteers'}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-subtle">
            {data.programs.upcoming} upcoming programs · {data.programs.rsvp_attending} attending
            RSVPs
          </p>
        </section>

        {data.giving && (
          <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">Giving this month</h2>
                <p className="mt-1 text-xs text-ink-muted">Visible only to finance-capable roles</p>
              </div>
              <p className="text-2xl font-semibold text-ink">
                {formatAmount(data.giving.month_total, data.giving.currency)}
              </p>
            </div>
            <div className="mt-4">
              <BarChart points={data.giving.monthly} valueKey="total" />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
