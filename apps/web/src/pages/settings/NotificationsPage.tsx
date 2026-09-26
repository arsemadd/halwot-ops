import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, getErrorMessage } from '../../lib/api'
import { unwrapList } from '../../lib/unwrap'
import { queryClient } from '../../lib/query'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/Toast'
import type { AppNotification } from '../../types'

const fetchNotifications = async (): Promise<AppNotification[]> => {
  const { data } = await api.get('/api/v1/notifications')
  return unwrapList<AppNotification>(data)
}

export const NotificationsPage = () => {
  const { showToast } = useToast()

  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  })

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/api/v1/notifications/${id}/read`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.patch('/api/v1/notifications/mark-all-read')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      showToast('All notifications marked as read', 'success')
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  })

  const unreadCount = notifications.filter((n) => !n.read_at).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="In-app alerts for follow-ups, checkouts, expenses, and operational events"
        actions={
          unreadCount > 0 ? (
            <Button
              variant="secondary"
              onClick={() => markAllRead.mutate()}
              isLoading={markAllRead.isPending}
            >
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {isLoading && <p className="text-sm text-ink-muted">Loading notifications…</p>}
      {isError && <p className="text-sm text-danger">Unable to load notifications.</p>}

      {!isLoading && !isError && notifications.length === 0 && (
        <EmptyState
          title="No notifications yet"
          description="Operational alerts will appear here as work happens across Halwot Ops."
        />
      )}

      {!isLoading && notifications.length > 0 && (
        <ul className="panel divide-y divide-border overflow-hidden">
          {notifications.map((notification) => {
            const isUnread = !notification.read_at
            return (
              <li
                key={notification.id}
                className={isUnread ? 'bg-accent-light/40' : 'bg-white'}
              >
                <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      )}
                      <h3 className="font-semibold text-ink">{notification.title}</h3>
                    </div>
                    {notification.body && (
                      <p className="mt-1 text-sm text-ink-muted">{notification.body}</p>
                    )}
                    <p className="mt-2 text-xs text-ink-subtle">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {notification.link && (
                      <Link to={notification.link}>
                        <Button variant="secondary" size="sm">Open</Button>
                      </Link>
                    )}
                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markRead.mutate(notification.id)}
                        isLoading={markRead.isPending}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
