import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { api, getErrorMessage } from '../../lib/api'
import { queryClient } from '../../lib/query'
import { unwrapData, unwrapList } from '../../lib/unwrap'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { getFollowUpStatusTone, StatusPill } from '../../components/ui/StatusPill'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getPersonDisplayName, type FollowUp, type Person, type User } from '../../types'

const followUpSchema = z.object({
  person_id: z.string().min(1, 'Select a person'),
  owner_user_id: z.string().optional(),
  next_action_at: z.string().optional(),
  notes: z.string().optional(),
})

type FollowUpForm = z.infer<typeof followUpSchema>

const statusFilterOptions = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

const fetchFollowUps = async (status: string, overdue: boolean): Promise<FollowUp[]> => {
  const params: Record<string, string> = {}
  if (status) params.status = status
  if (overdue) params.overdue = '1'
  const { data } = await api.get('/api/v1/follow-ups', { params })
  return unwrapList<FollowUp>(data)
}

const fetchPeople = async (): Promise<Person[]> => {
  const { data } = await api.get('/api/v1/people')
  return unwrapList<Person>(data)
}

const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/api/v1/users')
  return unwrapList<User>(data)
}

export const FollowUpsPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [showOverdueOnly, setShowOverdueOnly] = useState(searchParams.get('overdue') === '1')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['follow-ups', statusFilter, showOverdueOnly],
    queryFn: () => fetchFollowUps(statusFilter, showOverdueOnly),
  })

  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
    enabled: isModalOpen,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isModalOpen,
  })

  const statusCounts = useMemo(() => {
    const counts = { open: 0, in_progress: 0, completed: 0, overdue: 0 }
    followUps.forEach((fu) => {
      if (fu.status === 'open') counts.open++
      if (fu.status === 'in_progress') counts.in_progress++
      if (fu.status === 'completed') counts.completed++
      if (fu.is_overdue) counts.overdue++
    })
    return counts
  }, [followUps])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FollowUpForm>({
    resolver: zodResolver(followUpSchema),
  })

  const createFollowUp = useMutation({
    mutationFn: async (formData: FollowUpForm) => {
      const payload = {
        person_id: Number(formData.person_id),
        owner_user_id: formData.owner_user_id ? Number(formData.owner_user_id) : undefined,
        next_action_at: formData.next_action_at || undefined,
        notes: formData.notes || undefined,
        status: 'open',
      }
      const { data } = await api.post('/api/v1/follow-ups', payload)
      return unwrapData<FollowUp>(data)
    },
    onSuccess: (followUp) => {
      void queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
      showToast('Follow-up created', 'success')
      setIsModalOpen(false)
      reset()
      navigate(`/people/follow-ups/${followUp.id}`)
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleCreate = async (formData: FollowUpForm) => {
    await createFollowUp.mutateAsync(formData)
  }

  const handleRowClick = (id: number) => {
    navigate(`/people/follow-ups/${id}`)
  }

  const personOptions = [
    { value: '', label: 'Select a person' },
    ...people.map((p) => ({
      value: String(p.id),
      label: getPersonDisplayName(p),
    })),
  ]

  const ownerOptions = [
    { value: '', label: 'Unassigned' },
    ...users.map((u) => ({ value: String(u.id), label: u.name })),
  ]

  return (
    <div>
      <PageHeader
        title="Follow-up queue"
        description="Track pastoral care and visitor follow-ups"
        actions={<Button onClick={() => setIsModalOpen(true)}>New follow-up</Button>}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        {(['open', 'in_progress', 'completed'] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setShowOverdueOnly(false)
              setStatusFilter(statusFilter === status ? '' : status)
            }}
            className="rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-accent/30"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle capitalize">
              {status.replace('_', ' ')}
            </p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {statusCounts[status]}
            </p>
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('')
            setShowOverdueOnly(!showOverdueOnly)
          }}
          className="rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-accent/30"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">Overdue</p>
          <p className="mt-1 text-2xl font-semibold text-danger">
            {statusCounts.overdue}
          </p>
        </button>
      </div>
      <div className="mb-4 w-full sm:w-48">
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        />
      </div>
      {isLoading && <p className="text-sm text-ink-muted">Loading follow-ups…</p>}
      {!isLoading && followUps.length === 0 && (
        <EmptyState
          title="No follow-ups"
          description="Create a follow-up to track pastoral care."
          action={<Button onClick={() => setIsModalOpen(true)}>New follow-up</Button>}
        />
      )}
      {!isLoading && followUps.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Person</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Next action</TableHead>
            <TableHead>Last contact</TableHead>
          </TableHeader>
          <TableBody>
            {followUps.map((followUp) => (
              <TableRow key={followUp.id} onClick={() => handleRowClick(followUp.id)}>
                <TableCell className="font-medium">
                  {followUp.person ? getPersonDisplayName(followUp.person) : '—'}
                </TableCell>
                <TableCell>{followUp.owner?.name || '—'}</TableCell>
                <TableCell>
                  <StatusPill
                    label={followUp.is_overdue ? `${followUp.status} (overdue)` : followUp.status}
                    tone={getFollowUpStatusTone(followUp.status, followUp.is_overdue)}
                  />
                </TableCell>
                <TableCell>
                  {followUp.next_action_at
                    ? new Date(followUp.next_action_at).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell>
                  {followUp.last_contact_at
                    ? new Date(followUp.last_contact_at).toLocaleDateString()
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New follow-up"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(handleCreate)} isLoading={isSubmitting || createFollowUp.isPending}>
              Create
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(handleCreate)}>
          <Select label="Person" options={personOptions} error={errors.person_id?.message} {...register('person_id')} />
          <Select label="Owner" options={ownerOptions} {...register('owner_user_id')} />
          <Input label="Next action date" type="date" {...register('next_action_at')} />
          <Textarea label="Notes" rows={3} {...register('notes')} />
        </form>
      </Modal>
    </div>
  )
}
