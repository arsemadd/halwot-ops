import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'
import { api, getErrorMessage } from '../../lib/api'
import { queryClient } from '../../lib/query'
import { unwrapData, unwrapList } from '../../lib/unwrap'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { getFollowUpStatusTone, StatusPill } from '../../components/ui/StatusPill'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getPersonDisplayName, type FollowUp, type User } from '../../types'

const followUpSchema = z.object({
  owner_user_id: z.string().optional(),
  status: z.enum(['open', 'in_progress', 'completed']),
  last_contact_at: z.string().optional(),
  next_action_at: z.string().optional(),
  notes: z.string().optional(),
})

type FollowUpForm = z.infer<typeof followUpSchema>

const statusOptions = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

const fetchFollowUp = async (id: string): Promise<FollowUp> => {
  const { data } = await api.get(`/api/v1/follow-ups/${id}`)
  return unwrapData<FollowUp>(data)
}

const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/api/v1/users')
  return unwrapList<User>(data)
}

export const FollowUpDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()

  const { data: followUp, isLoading } = useQuery({
    queryKey: ['follow-ups', id],
    queryFn: () => fetchFollowUp(id!),
    enabled: !!id,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FollowUpForm>({
    resolver: zodResolver(followUpSchema),
  })

  useEffect(() => {
    if (followUp) {
      reset({
        owner_user_id: followUp.owner_user_id ? String(followUp.owner_user_id) : '',
        status: followUp.status,
        last_contact_at: followUp.last_contact_at ? followUp.last_contact_at.split('T')[0] : '',
        next_action_at: followUp.next_action_at ? followUp.next_action_at.split('T')[0] : '',
        notes: followUp.notes || '',
      })
    }
  }, [followUp, reset])

  const updateFollowUp = useMutation({
    mutationFn: async (formData: FollowUpForm) => {
      const payload = {
        owner_user_id: formData.owner_user_id ? Number(formData.owner_user_id) : null,
        status: formData.status,
        last_contact_at: formData.last_contact_at || null,
        next_action_at: formData.next_action_at || null,
        notes: formData.notes || null,
      }
      const { data } = await api.patch(`/api/v1/follow-ups/${id}`, payload)
      return unwrapData<FollowUp>(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['follow-ups'] })
      void queryClient.invalidateQueries({ queryKey: ['follow-ups', id] })
      showToast('Follow-up updated', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleSave = async (formData: FollowUpForm) => {
    await updateFollowUp.mutateAsync(formData)
  }

  const handleQuickStatus = async (status: FollowUpForm['status']) => {
    await updateFollowUp.mutateAsync({ ...getValues(), status })
  }

  const ownerOptions = [
    { value: '', label: 'Unassigned' },
    ...users.map((u) => ({ value: String(u.id), label: u.name })),
  ]

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading follow-up…</p>
  }

  if (!followUp) {
    return <p className="text-sm text-danger">Follow-up not found.</p>
  }

  return (
    <div>
      <PageHeader
        title="Follow-up"
        description={
          followUp.person ? getPersonDisplayName(followUp.person) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            <StatusPill
              label={followUp.is_overdue ? `${followUp.status} (overdue)` : followUp.status}
              tone={getFollowUpStatusTone(followUp.status, followUp.is_overdue)}
            />
            <Link to="/people/follow-ups">
              <Button variant="secondary">Back to queue</Button>
            </Link>
          </div>
        }
      />
      {followUp.person && (
        <p className="mb-4 text-sm text-ink-muted">
          Person:{' '}
          <Link to={`/people/members/${followUp.person.id}`} className="text-accent hover:underline">
            {getPersonDisplayName(followUp.person)}
          </Link>
        </p>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        {statusOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={followUp.status === opt.value ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => handleQuickStatus(opt.value as FollowUpForm['status'])}
            disabled={updateFollowUp.isPending}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      <form
        onSubmit={handleSubmit(handleSave)}
        className="max-w-2xl space-y-4 rounded-lg border border-border bg-surface p-6"
      >
        <Select label="Owner" options={ownerOptions} {...register('owner_user_id')} />
        <Select label="Status" options={statusOptions} error={errors.status?.message} {...register('status')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Last contact" type="date" {...register('last_contact_at')} />
          <Input label="Next action" type="date" {...register('next_action_at')} />
        </div>
        <Textarea label="Notes" rows={5} {...register('notes')} />
        <Button type="submit" isLoading={isSubmitting || updateFollowUp.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
    </div>
  )
}
