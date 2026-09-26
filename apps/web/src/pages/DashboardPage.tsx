import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { unwrapData } from '../lib/unwrap'
import { useAuth } from '../lib/auth'
import type { DashboardData, DashboardFollowUpItem, MemberGrowthPoint } from '../types'

const fetchDashboard = async (): Promise<DashboardData> => {
  const { data } = await api.get('/api/v1/dashboard')
  return unwrapData<DashboardData>(data)
}

const initials = (name?: string | null) => {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

const formatWhen = (value?: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const isTomorrow = date.toDateString() === tomorrow.toDateString()
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (sameDay) return `Today, ${time}`
  if (isTomorrow) return `Tomorrow, ${time}`
  return date.toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const MemberGrowthChart = ({ points }: { points: MemberGrowthPoint[] }) => {
  const max = Math.max(...points.map((p) => p.count), 1)

  return (
    <div className="flex h-48 items-end gap-3 px-1 pt-4">
      {points.map((point) => {
        const height = Math.max((point.count / max) * 100, point.count > 0 ? 12 : 4)
        const isLatest = point === points[points.length - 1]
        return (
          <div key={point.month} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full items-end justify-center">
              <div
                className={`w-full max-w-[42px] rounded-t-lg transition-all ${
                  isLatest
                    ? 'bg-accent shadow-[0_8px_18px_rgba(244,121,32,0.28)]'
                    : 'bg-[#f3d2bc]'
                }`}
                style={{ height: `${height}%` }}
                title={`${point.label}: ${point.count}`}
              />
            </div>
            <span className="text-xs font-medium text-ink-subtle">{point.label}</span>
          </div>
        )
      })}
    </div>
  )
}

const MiniSparkline = ({ points }: { points: MemberGrowthPoint[] }) => {
  if (points.length < 2) return null
  const max = Math.max(...points.map((p) => p.count), 1)
  const width = 120
  const height = 28
  const coords = points.map((point, index) => {
    const x = (index / (points.length - 1)) * width
    const y = height - (point.count / max) * (height - 4) - 2
    return `${x},${y}`
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-7 w-full text-accent" aria-hidden="true">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(' ')}
      />
    </svg>
  )
}

const FollowUpRow = ({ item }: { item: DashboardFollowUpItem }) => {
  const name = item.preferred_name || item.person_name || 'Unknown'
  return (
    <Link
      to={`/people/follow-ups/${item.id}`}
      className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
        item.is_overdue ? 'bg-[#fdecec]' : 'hover:bg-canvas-elevated'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f8e4d4] text-xs font-bold text-accent">
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{name}</p>
        <p className="truncate text-xs text-ink-muted">{item.reason}</p>
      </div>
      {item.is_overdue ? (
        <span className="shrink-0 rounded-full bg-[#f8d7d3] px-2.5 py-1 text-[11px] font-semibold text-[#b42318]">
          {item.days_overdue === 0 ? 'Due today' : `${item.days_overdue}d overdue`}
        </span>
      ) : item.due_today ? (
        <span className="shrink-0 rounded-full bg-[#ffe8d4] px-2.5 py-1 text-[11px] font-semibold text-accent">
          Due today
        </span>
      ) : (
        <span className="shrink-0 rounded-full bg-canvas-elevated px-2.5 py-1 text-[11px] font-medium text-ink-muted">
          Open
        </span>
      )}
    </Link>
  )
}

export const DashboardPage = () => {
  const { user } = useAuth()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  })

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading dashboard…</p>
  }

  if (isError || !data) {
    return <p className="text-sm text-danger">Unable to load dashboard data.</p>
  }

  const growth = data.member_growth ?? []
  const peopleCount = data.total_people ?? data.members
  const followUps = data.priority_follow_ups ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Halwot Emmanuel United Church
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{todayLabel}</p>
        {user && (
          <p className="mt-1 text-xs text-ink-subtle">Signed in as {user.name}</p>
        )}
      </div>

      {data.attention && (
        <Link
          to={data.attention.link}
          className="flex flex-col gap-3 rounded-2xl border border-[#f3d2b0] bg-[#fff4e8] px-4 py-4 transition-colors hover:bg-[#ffefdf] sm:flex-row sm:items-center sm:justify-between sm:px-5"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
              !
            </div>
            <div>
              <p className="font-semibold text-[#7a3e12]">{data.attention.title}</p>
              <p className="mt-0.5 text-sm text-[#8a5a2b]">{data.attention.message}</p>
            </div>
          </div>
          <span className="text-sm font-semibold text-accent sm:shrink-0">Review now →</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/people/members" className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-accent/30">
          <p className="text-xs font-medium text-ink-muted">Total Members</p>
          <p className="mt-2 text-3xl font-bold text-ink">{peopleCount}</p>
          <p className="mt-2 text-xs font-medium text-success">
            {data.new_this_month > 0 ? `▲ +${data.new_this_month} this month` : 'No new people this month'}
          </p>
          <MiniSparkline points={growth} />
        </Link>

        <Link to="/ministry/serving" className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-accent/30">
          <p className="text-xs font-medium text-ink-muted">Active Volunteers</p>
          <p className="mt-2 text-3xl font-bold text-ink">{data.active_volunteers}</p>
          <p className="mt-2 text-xs text-ink-muted">Serving across ministries</p>
        </Link>

        <Link to="/people/follow-ups" className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-accent/30">
          <p className="text-xs font-medium text-ink-muted">Open Follow-ups</p>
          <p className={`mt-2 text-3xl font-bold ${data.overdue_follow_ups > 0 ? 'text-[#b42318]' : 'text-ink'}`}>
            {data.open_follow_ups}
          </p>
          <p className={`mt-2 text-xs font-medium ${data.overdue_follow_ups > 0 ? 'text-[#b42318]' : 'text-ink-muted'}`}>
            {data.overdue_follow_ups > 0
              ? `▼ ${data.overdue_follow_ups} overdue`
              : 'None overdue'}
          </p>
        </Link>

        <Link to="/programs" className="rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-accent/30">
          <p className="text-xs font-medium text-ink-muted">Programs This Month</p>
          <p className="mt-2 text-3xl font-bold text-ink">{data.programs_this_month}</p>
          <p className="mt-2 truncate text-xs text-ink-muted">
            {data.next_program_title ? `Next: ${data.next_program_title}` : 'No upcoming programs'}
          </p>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Member Growth</h2>
            <Link to="/people/members" className="text-sm font-medium text-accent hover:text-accent-hover">
              View all members
            </Link>
          </div>
          {growth.length > 0 ? (
            <MemberGrowthChart points={growth} />
          ) : (
            <p className="py-10 text-sm text-ink-muted">Not enough history yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Follow-ups</h2>
            <Link to="/people/follow-ups" className="text-sm font-medium text-accent hover:text-accent-hover">
              Manage all
            </Link>
          </div>
          {followUps.length === 0 ? (
            <p className="py-8 text-sm text-ink-muted">No open follow-ups.</p>
          ) : (
            <div className="space-y-1">
              {followUps.map((item) => (
                <FollowUpRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Recent Activity</h2>
            <Link to="/settings/activity-log" className="text-sm font-medium text-accent hover:text-accent-hover">
              See all
            </Link>
          </div>
          {(data.recent_activity?.length ?? 0) === 0 ? (
            <p className="py-8 text-sm text-ink-muted">No recent activity yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent_activity?.map((item) => (
                <li key={item.id} className="flex gap-3 py-3">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      item.tone === 'success'
                        ? 'bg-success'
                        : item.tone === 'accent'
                          ? 'bg-accent'
                          : 'bg-ink-subtle'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-ink">{item.description || item.action}</p>
                    <p className="mt-0.5 text-xs text-ink-subtle">{formatWhen(item.created_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Upcoming Programs</h2>
            <Link to="/programs" className="text-sm font-medium text-accent hover:text-accent-hover">
              See calendar
            </Link>
          </div>
          {data.upcoming_programs.length === 0 ? (
            <p className="py-8 text-sm text-ink-muted">No upcoming programs.</p>
          ) : (
            <ul className="space-y-2">
              {data.upcoming_programs.map((program) => (
                <li key={program.id}>
                  <Link
                    to={`/programs/${program.id}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-canvas-elevated"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffe8d4] text-accent">
                      ✝
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{program.title}</p>
                      <p className="text-xs text-ink-muted">{formatWhen(program.starts_at)}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#ffe8d4] px-2.5 py-1 text-[11px] font-semibold text-accent">
                      {program.serving_count ?? 0} serving
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
