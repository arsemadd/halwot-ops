import clsx from 'clsx'
import type { ComponentType, SVGProps } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { hasPermission } from '../../lib/permissions'
import {
  IconActivity,
  IconAnnounce,
  IconAsset,
  IconBell,
  IconCheckout,
  IconChurch,
  IconDashboard,
  IconExpense,
  IconFollowUp,
  IconGiving,
  IconHome,
  IconMap,
  IconMinistry,
  IconPortal,
  IconProgram,
  IconReports,
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
  permission?: string | string[]
}

type NavGroup = {
  title?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', to: '/', icon: IconDashboard, permission: 'people.view' },
      { label: 'My portal', to: '/portal', icon: IconPortal, permission: 'portal.access' },
      { label: 'Reports', to: '/reports', icon: IconReports, permission: 'reports.view' },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Members', to: '/people/members', icon: IconUsers, permission: 'people.view' },
      {
        label: 'Registration',
        to: '/people/members/register',
        icon: IconUserPlus,
        permission: 'people.create',
      },
      { label: 'Households', to: '/people/households', icon: IconHome, permission: 'people.view' },
      {
        label: 'Follow-up',
        to: '/people/follow-ups',
        icon: IconFollowUp,
        permission: 'follow_up.view',
      },
    ],
  },
  {
    title: 'Ministry',
    items: [
      {
        label: 'Ministries',
        to: '/ministry/ministries',
        icon: IconMinistry,
        permission: 'ministries.view',
      },
      { label: 'Serving', to: '/ministry/serving', icon: IconServing, permission: 'ministries.view' },
    ],
  },
  {
    title: 'Programs',
    items: [{ label: 'Programs', to: '/programs', icon: IconProgram, permission: 'programs.view' }],
  },
  {
    title: 'Communications',
    items: [
      {
        label: 'Announcements',
        to: '/communications/announcements',
        icon: IconAnnounce,
        permission: 'announcements.view',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Assets', to: '/operations/assets', icon: IconAsset, permission: 'assets.view' },
      {
        label: 'Checkouts',
        to: '/operations/checkouts',
        icon: IconCheckout,
        permission: 'assets.checkout',
      },
      {
        label: 'Expenses',
        to: '/operations/expenses',
        icon: IconExpense,
        permission: 'expenses.view',
      },
      { label: 'Giving', to: '/finance/giving', icon: IconGiving, permission: 'giving.view' },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        label: 'Notifications',
        to: '/settings/notifications',
        icon: IconBell,
      },
      { label: 'Users', to: '/settings/users', icon: IconUsers, permission: 'users.view' },
      { label: 'Roles', to: '/settings/roles', icon: IconShield, permission: 'roles.view' },
      {
        label: 'Church profile',
        to: '/settings/church-profile',
        icon: IconChurch,
        permission: 'settings.manage',
      },
      {
        label: 'Activity log',
        to: '/settings/activity-log',
        icon: IconActivity,
        permission: 'activity.view',
      },
      { label: 'Roadmap', to: '/settings/roadmap', icon: IconMap, permission: 'settings.manage' },
    ],
  },
]

export const Sidebar = () => {
  const { user } = useAuth()
  const permissions = user?.permissions

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.permission) return true
        return hasPermission(permissions, item.permission)
      }),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-[#fbfafa]">
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <img
            src="/halwot-logo.png"
            alt="Halwot Emmanuel United Church"
            className="h-9 w-9 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-tight text-ink">
              Halwot Ops
            </div>
            <div className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-ink-subtle">
              HEC OS
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 pb-4" aria-label="Main navigation">
        {visibleGroups.map((group, groupIndex) => (
          <div key={group.title || `group-${groupIndex}`} className={groupIndex > 0 ? 'mt-5' : ''}>
            {group.title && (
              <div className="mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-subtle/80">
                {group.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <li key={`${item.to}-${item.label}`}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-2.5 rounded-full px-2.5 py-2 text-[13px] font-medium transition-colors',
                          isActive
                            ? 'bg-accent text-white'
                            : 'text-ink-muted hover:bg-white hover:text-ink',
                        )
                      }
                    >
                      <Icon className="shrink-0 opacity-80" />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
