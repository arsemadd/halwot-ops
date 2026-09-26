import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { unwrapList } from '../../lib/unwrap'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import type { Role } from '../../types'

const fetchRoles = async (): Promise<Role[]> => {
  const { data } = await api.get('/api/v1/roles')
  return unwrapList<Role>(data)
}

export const RolesPage = () => {
  const { data: roles = [], isLoading, isError } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  })

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Permission roles for system access control"
      />
      {isLoading && <p className="text-sm text-ink-muted">Loading roles…</p>}
      {isError && <p className="text-sm text-danger">Unable to load roles.</p>}
      {!isLoading && !isError && roles.length === 0 && (
        <EmptyState
          title="No roles found"
          description="Roles will appear here once configured."
        />
      )}
      {!isLoading && roles.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Role</TableHead>
            <TableHead>Permissions</TableHead>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>
                  {role.permissions?.join(', ') || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
