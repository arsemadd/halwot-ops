import { useAuth } from '../../lib/auth'
import { Button } from '../ui/Button'

export const TopBar = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-canvas-elevated/80 px-6 backdrop-blur-md">
      <div>
        <p className="text-sm font-semibold text-ink">
          Halwot Emmanuel <span className="text-accent">United Church</span>
        </p>
        <p className="text-xs text-ink-subtle">Church operations workspace</p>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden rounded-full border border-border bg-surface px-3 py-1.5 sm:block">
            <span className="text-sm font-medium text-ink">{user.name}</span>
          </div>
        )}
        <Button variant="secondary" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
