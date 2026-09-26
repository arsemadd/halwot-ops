import clsx from 'clsx'
import type { ComponentType, SVGProps } from 'react'
import { NavLink } from 'react-router-dom'
import {
  IconActivity,
  IconAsset,
  IconBell,
  IconCheckout,
  IconChurch,
  IconDashboard,
  IconExpense,
  IconFollowUp,
  IconHome,
  IconMap,
  IconMinistry,
  IconProgram,
  IconServing,
  IconShield,
  IconUserPlus,
  IconUsers,
} from './NavIcons'

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

type NavItem = {
  label: string
  to: string
  icon: IconComponent
}

type NavGroup = {
  title?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    items: [{ label: 'Dashboard', to: '/', icon: IconDashboard }],
  },
  {
    title: 'People',
    items: [
      { label: 'Members', to: '/people/members', icon: IconUsers },
      { label: 'Registration', to: '/people/members/register', icon: IconUserPlus },
      { label: 'Households', to: '/people/households', icon: IconHome },
      { label: 'Follow-up', to: '/people/follow-ups', icon: IconFollowUp },
    ],
  },
  {
    title: 'Ministry',
    items: [
      { label: 'Ministries', to: '/ministry/ministries', icon: IconMinistry },
      { label: 'Serving', to: '/ministry/serving', icon: IconServing },
    ],
  },
  {
    title: 'Programs',
    items: [{ label: 'Programs', to: '/programs', icon: IconProgram }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Assets', to: '/operations/assets', icon: IconAsset },
      { label: 'Checkouts', to: '/operations/checkouts', icon: IconCheckout },
      { label: 'Expenses', to: '/operations/expenses', icon: IconExpense },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Notifications', to: '/settings/notifications', icon: IconBell },
      { label: 'Users', to: '/settings/users', icon: IconUsers },
      { label: 'Roles', to: '/settings/roles', icon: IconShield },
      { label: 'Church profile', to: '/settings/church-profile', icon: IconChurch },
      { label: 'Activity log', to: '/settings/activity-log', icon: IconActivity },
      { label: 'Roadmap', to: '/settings/roadmap', icon: IconMap },
    ],
  },
]

export const Sidebar = () => (
  <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-white">
    <div className="border-b border-border px-4 py-5">
      <div className="flex items-center gap-3">
        <img
          src="/halwot-logo.png"
          alt="Halwot Emmanuel United Church"
          className="h-11 w-11 rounded-full ring-2 ring-accent/30"
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
        <div key={group.title || `group-${groupIndex}`} className={groupIndex > 0 ? 'mt-5' : ''}>
          {group.title && (
            <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-subtle">
              {group.title}
            </div>
          )}
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <li key={`${item.to}-${item.label}`}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-accent text-white shadow-[0_8px_20px_rgba(244,121,32,0.28)]'
                          : 'text-ink-muted hover:bg-accent-light hover:text-ink',
                      )
                    }
                  >
                    <Icon className="shrink-0 opacity-90" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
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
