import clsx from 'clsx'
import { NavLink } from 'react-router-dom'

type NavItem = {
  label: string
  to: string
}

type NavGroup = {
  title?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', to: '/' }],
  },
  {
    title: 'People',
    items: [
      { label: 'Members', to: '/people/members' },
      { label: 'Households', to: '/people/households' },
      { label: 'Follow-up', to: '/people/follow-ups' },
    ],
  },
  {
    title: 'Ministry',
    items: [
      { label: 'Ministries', to: '/ministry/ministries' },
      { label: 'Serving', to: '/ministry/serving' },
    ],
  },
  {
    title: 'Programs',
    items: [{ label: 'Programs', to: '/programs' }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Assets', to: '/operations/assets' },
      { label: 'Checkouts', to: '/operations/checkouts' },
      { label: 'Expenses', to: '/operations/expenses' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Users', to: '/settings/users' },
      { label: 'Roles', to: '/settings/roles' },
      { label: 'Church profile', to: '/settings/church-profile' },
      { label: 'Activity log', to: '/settings/activity-log' },
      { label: 'Roadmap', to: '/settings/roadmap' },
    ],
  },
]

export const Sidebar = () => (
  <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
    <div className="border-b border-border px-5 py-5">
      <div className="font-[family-name:var(--font-wordmark)] text-xl font-semibold text-accent">
        Halwot Ops
      </div>
      <div className="mt-0.5 text-xs text-ink-subtle">HEC OS</div>
    </div>
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
      {navGroups.map((group, groupIndex) => (
        <div key={group.title || `group-${groupIndex}`} className={groupIndex > 0 ? 'mt-6' : ''}>
          {group.title && (
            <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
              {group.title}
            </div>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'block rounded-md px-2 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-accent-light text-accent'
                        : 'text-ink-muted hover:bg-canvas hover:text-ink',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  </aside>
)
