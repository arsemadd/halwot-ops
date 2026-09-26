import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { unwrapList } from '../../lib/unwrap'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { StatusPill } from '../../components/ui/StatusPill'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { getPersonDisplayName, type MinistryMembership } from '../../types'

const fetchServing = async (): Promise<MinistryMembership[]> => {
  const { data } = await api.get('/api/v1/serving')
  return unwrapList<MinistryMembership>(data)
}

export const ServingPage = () => {
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['serving'],
    queryFn: fetchServing,
  })

  return (
    <div>
      <PageHeader
        title="Serving"
        description="Ministry memberships across all teams"
      />
      {isLoading && <p className="text-sm text-ink-muted">Loading serving records…</p>}
      {!isLoading && memberships.length === 0 && (
        <EmptyState
          title="No serving records"
          description="Ministry memberships will appear here when members are assigned."
        />
      )}
      {!isLoading && memberships.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Member</TableHead>
            <TableHead>Ministry</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>Status</TableHead>
          </TableHeader>
          <TableBody>
            {memberships.map((membership) => (
              <TableRow key={membership.id}>
                <TableCell>
                  {membership.person ? (
                    <Link to={`/people/members/${membership.person.id}`} className="font-medium text-accent hover:underline">
                      {getPersonDisplayName(membership.person)}
                    </Link>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {membership.ministry ? (
                    <Link to={`/ministry/ministries/${membership.ministry.id}`} className="text-accent hover:underline">
                      {membership.ministry.name}
                    </Link>
                  ) : '—'}
                </TableCell>
                <TableCell>{membership.role || '—'}</TableCell>
                <TableCell>{membership.availability || '—'}</TableCell>
                <TableCell>
                  <StatusPill
                    label={membership.status}
                    tone={membership.status === 'active' ? 'success' : 'neutral'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
