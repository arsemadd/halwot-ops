import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { unwrapList } from '../../lib/unwrap'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { getMembershipStatusTone, StatusPill } from '../../components/ui/StatusPill'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { getPersonDisplayName, type Person } from '../../types'

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow up' },
  { value: 'connected', label: 'Connected' },
  { value: 'member', label: 'Member' },
  { value: 'inactive', label: 'Inactive' },
]

const fetchMembers = async (q: string, status: string): Promise<Person[]> => {
  const params: Record<string, string> = {}
  if (q) params.q = q
  if (status) params.status = status
  const { data } = await api.get('/api/v1/people', { params })
  return unwrapList<Person>(data)
}

export const MembersPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const handleSearchChange = (value: string) => {
    setSearch(value)
    window.clearTimeout((window as unknown as { _searchTimer?: number })._searchTimer)
    ;(window as unknown as { _searchTimer?: number })._searchTimer = window.setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
  }

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['people', debouncedSearch, status],
    queryFn: () => fetchMembers(debouncedSearch, status),
  })

  const handleRowClick = (id: number) => {
    navigate(`/people/members/${id}`)
  }

  return (
    <div>
      <PageHeader
        title="Members"
        description="Manage church members and visitors"
        actions={
          <Link to="/people/members/register">
            <Button>Register member</Button>
          </Link>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Search members"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by membership status"
          />
        </div>
      </div>
      {isLoading && <p className="text-sm text-ink-muted">Loading members…</p>}
      {!isLoading && members.length === 0 && (
        <EmptyState
          title="No members found"
          description="Register a new member or adjust your search filters."
          action={
            <Link to="/people/members/register">
              <Button>Register member</Button>
            </Link>
          }
        />
      )}
      {!isLoading && members.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Household</TableHead>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} onClick={() => handleRowClick(member.id)}>
                <TableCell className="font-medium">
                  {getPersonDisplayName(member)}
                </TableCell>
                <TableCell>{member.email || '—'}</TableCell>
                <TableCell>{member.phone || '—'}</TableCell>
                <TableCell>
                  <StatusPill
                    label={member.membership_status}
                    tone={getMembershipStatusTone(member.membership_status)}
                  />
                </TableCell>
                <TableCell>{member.household?.name || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
