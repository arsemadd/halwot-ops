import { useAuth } from '../../lib/auth'
import { Button } from '../ui/Button'

export const TopBar = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="text-sm text-ink-muted">
        Halwot Emmanuel Church
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-ink">
            {user.name}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
