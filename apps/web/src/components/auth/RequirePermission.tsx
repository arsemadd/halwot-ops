import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../lib/auth'
import { hasPermission } from '../../lib/permissions'

type RequirePermissionProps = {
  permission: string | string[]
  children: ReactNode
  fallback?: string
}

export const RequirePermission = ({
  permission,
  children,
  fallback = '/',
}: RequirePermissionProps) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading…</p>
  }

  if (!hasPermission(user?.permissions, permission)) {
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
