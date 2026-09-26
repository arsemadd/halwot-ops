import { useAuth } from '../../lib/auth'
import { Button } from '../ui/Button'

export const TopBar = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-3 border-b border-border/70 bg-transparent px-6">
      {user && (
        <span className="hidden text-sm text-ink-muted sm:inline">{user.name}</span>
      )}
      <Button variant="secondary" size="sm" onClick={handleLogout}>
        Sign out
      </Button>
    </header>
  )
}
