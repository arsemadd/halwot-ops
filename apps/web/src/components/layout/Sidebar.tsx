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
  <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-canvas-elevated">
    <div className="border-b border-border px-4 py-5">
      <div className="flex items-center gap-3">
        <img
          src="/halwot-logo.png"
          alt="Halwot Emmanuel United Church"
          className="h-11 w-11 rounded-full ring-2 ring-accent/40"
        />
        <div className="min-w-0">
          <div className="truncate text-base font-bold tracking-tight text-ink">
            Halwot <span className="text-accent">Ops</span>
          </div>
          <div className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-ink-subtle">
            HEC OS
          </div>
        </div>
      </div>
    </div>
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
      {navGroups.map((group, groupIndex) => (
        <div key={group.title || `group-${groupIndex}`} className={groupIndex > 0 ? 'mt-6' : ''}>
          {group.title && (
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
              {group.title}
            </div>
          )}
          <ul className="space-y-1">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'block rounded-xl px-3 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-accent text-white shadow-[0_8px_20px_rgba(244,121,32,0.35)]'
                        : 'text-ink-muted hover:bg-accent-light hover:text-ink',
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
    <div className="border-t border-border px-4 py-4">
      <p className="text-[11px] leading-relaxed text-ink-subtle">
        Halwot Emmanuel United Church
      </p>
    </div>
  </aside>
)
