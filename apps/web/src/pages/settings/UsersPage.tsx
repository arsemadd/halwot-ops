import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { unwrapList } from '../../lib/unwrap'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import type { User } from '../../types'

const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/api/v1/users')
  return unwrapList<User>(data)
}

export const UsersPage = () => {
  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  return (
    <div>
      <PageHeader
        title="Users"
        description="System users with access to HEC OS"
      />
      {isLoading && <p className="text-sm text-ink-muted">Loading users…</p>}
      {isError && <p className="text-sm text-danger">Unable to load users.</p>}
      {!isLoading && !isError && users.length === 0 && (
        <EmptyState
          title="No users found"
          description="User accounts will appear here once configured."
        />
      )}
      {!isLoading && users.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.roles?.join(', ') || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
