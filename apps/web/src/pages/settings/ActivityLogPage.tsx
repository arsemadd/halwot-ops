import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { unwrapList } from '../../lib/unwrap'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import type { ActivityLog } from '../../types'

const fetchActivityLogs = async (): Promise<ActivityLog[]> => {
  const { data } = await api.get('/api/v1/activity-logs')
  return unwrapList<ActivityLog>(data)
}

export const ActivityLogPage = () => {
  const { data: logs = [], isLoading, isError } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: fetchActivityLogs,
  })

  return (
    <div>
      <PageHeader
        title="Activity log"
        description="Audit trail of actions across HEC OS"
      />
      {isLoading && <p className="text-sm text-ink-muted">Loading activity log…</p>}
      {isError && <p className="text-sm text-danger">Unable to load activity log.</p>}
      {!isLoading && !isError && logs.length === 0 && (
        <EmptyState
          title="No activity yet"
          description="System actions will be recorded here."
        />
      )}
      {!isLoading && logs.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Action</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Date</TableHead>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.description || log.action}</TableCell>
                <TableCell>{log.user?.name || '—'}</TableCell>
                <TableCell>
                  {log.subject_type
                    ? `${log.subject_type}${log.subject_id ? ` #${log.subject_id}` : ''}`
                    : '—'}
                </TableCell>
                <TableCell>
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
