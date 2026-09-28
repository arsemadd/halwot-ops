import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export const IconDashboard = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
)

export const IconUsers = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="3" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a3 3 0 0 1 0 5.74" />
  </svg>
)

export const IconHome = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
)

export const IconUserPlus = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="3" />
    <path d="M19 8v6" />
    <path d="M22 11h-6" />
  </svg>
)

export const IconFollowUp = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
)

export const IconMinistry = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M12 2v20" />
    <path d="M5 8h14" />
    <path d="M7 8c0 4 2.5 7 5 10 2.5-3 5-6 5-10" />
  </svg>
)

export const IconServing = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M12 3v6" />
    <path d="M8 7h8" />
    <path d="M6 21h12" />
    <path d="M8 21V11a4 4 0 0 1 8 0v10" />
  </svg>
)

export const IconProgram = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
  </svg>
)

export const IconAsset = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M4 7h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

export const IconCheckout = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M9 6V5a3 3 0 0 1 6 0v1" />
    <path d="M4 9h16l-1.2 11.2A2 2 0 0 1 16.8 22H7.2a2 2 0 0 1-2-1.8L4 9z" />
  </svg>
)

export const IconExpense = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 10h18" />
    <path d="M7 15h4" />
  </svg>
)

export const IconBell = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
)

export const IconShield = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M12 3 5 6v6c0 5 3.5 7.5 7 9 3.5-1.5 7-4 7-9V6l-7-3z" />
  </svg>
)

export const IconSettings = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </svg>
)

export const IconActivity = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M3 12h4l2-6 4 12 2-6h6" />
  </svg>
)

export const IconMap = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
)

export const IconChurch = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M12 2v4" />
    <path d="M10 4h4" />
    <path d="M6 10 12 6l6 4v11H6V10z" />
    <path d="M10 21v-5h4v5" />
  </svg>
)

export const IconAnnounce = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z" />
    <path d="M16 8.5a4.5 4.5 0 0 1 0 7" />
    <path d="M18.5 6a8 8 0 0 1 0 12" />
  </svg>
)

export const IconGiving = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
  </svg>
)

export const IconReports = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 16V10" />
    <path d="M12 16V7" />
    <path d="M16 16v-4" />
  </svg>
)

export const IconPortal = (props: IconProps) => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" {...base} {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
)
