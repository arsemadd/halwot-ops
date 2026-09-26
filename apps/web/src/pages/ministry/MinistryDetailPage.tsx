import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'
import { api, getErrorMessage } from '../../lib/api'
import { queryClient } from '../../lib/query'
import { unwrapData, unwrapList } from '../../lib/unwrap'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { StatusPill } from '../../components/ui/StatusPill'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getPersonDisplayName, type Ministry, type Person } from '../../types'

const ministrySchema = z.object({
  name: z.string().min(1, 'Ministry name is required'),
  description: z.string().optional(),
  is_active: z.enum(['true', 'false']),
})

const membershipSchema = z.object({
  person_id: z.string().min(1, 'Select a member'),
  role: z.string().optional(),
  availability: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})

type MinistryForm = z.infer<typeof ministrySchema>
type MembershipForm = z.infer<typeof membershipSchema>

const activeOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

const membershipStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const fetchMinistry = async (id: string): Promise<Ministry> => {
  const { data } = await api.get(`/api/v1/ministries/${id}`)
  return unwrapData<Ministry>(data)
}

const fetchPeople = async (): Promise<Person[]> => {
  const { data } = await api.get('/api/v1/people')
  return unwrapList<Person>(data)
}

export const MinistryDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)

  const { data: ministry, isLoading } = useQuery({
    queryKey: ['ministries', id],
    queryFn: () => fetchMinistry(id!),
    enabled: !!id,
  })

  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
    enabled: isAddMemberOpen,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<MinistryForm>({
    resolver: zodResolver(ministrySchema),
  })

  const {
    register: registerMember,
    handleSubmit: handleSubmitMember,
    reset: resetMember,
    formState: { errors: memberErrors, isSubmitting: isMemberSubmitting },
  } = useForm<MembershipForm>({
    resolver: zodResolver(membershipSchema),
    defaultValues: { status: 'active' },
  })

  useEffect(() => {
    if (ministry) {
      reset({
        name: ministry.name,
        description: ministry.description || '',
        is_active: ministry.is_active ? 'true' : 'false',
      })
    }
  }, [ministry, reset])

  const updateMinistry = useMutation({
    mutationFn: async (formData: MinistryForm) => {
      const { data } = await api.patch(`/api/v1/ministries/${id}`, {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active === 'true',
      })
      return unwrapData<Ministry>(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ministries'] })
      void queryClient.invalidateQueries({ queryKey: ['ministries', id] })
      showToast('Ministry updated', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const addMember = useMutation({
    mutationFn: async (formData: MembershipForm) => {
      await api.post(`/api/v1/ministries/${id}/memberships`, {
        person_id: Number(formData.person_id),
        role: formData.role || null,
        availability: formData.availability || null,
        status: formData.status,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ministries', id] })
      showToast('Member added to ministry', 'success')
      setIsAddMemberOpen(false)
      resetMember()
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleSave = async (formData: MinistryForm) => {
    await updateMinistry.mutateAsync(formData)
  }

  const handleAddMember = async (formData: MembershipForm) => {
    await addMember.mutateAsync(formData)
  }

  const personOptions = [
    { value: '', label: 'Select a member' },
    ...people.map((p) => ({
      value: String(p.id),
      label: getPersonDisplayName(p),
    })),
  ]

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading ministry…</p>
  }

  if (!ministry) {
    return <p className="text-sm text-danger">Ministry not found.</p>
  }

  return (
    <div>
      <PageHeader
        title={ministry.name}
        description="Manage ministry details and team members"
        actions={
          <div className="flex gap-2">
            <Button onClick={() => setIsAddMemberOpen(true)}>Add member</Button>
            <Link to="/ministry/ministries">
              <Button variant="secondary">Back to list</Button>
            </Link>
          </div>
        }
      />
      <form
        onSubmit={handleSubmit(handleSave)}
        className="mb-8 max-w-2xl space-y-4 rounded-lg border border-border bg-surface p-6"
      >
        <Input label="Name" error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" rows={3} {...register('description')} />
        <Select label="Status" options={activeOptions} {...register('is_active')} />
        <Button type="submit" isLoading={isSubmitting || updateMinistry.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
      <h2 className="mb-4 text-lg font-semibold text-ink">Team members</h2>
      {ministry.memberships && ministry.memberships.length > 0 ? (
        <Table>
          <TableHeader>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead>Status</TableHead>
          </TableHeader>
          <TableBody>
            {ministry.memberships.map((membership) => (
              <TableRow key={membership.id}>
                <TableCell>
                  {membership.person ? (
                    <Link to={`/people/members/${membership.person.id}`} className="font-medium text-accent hover:underline">
                      {getPersonDisplayName(membership.person)}
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
      ) : (
        <p className="text-sm text-ink-muted">No members assigned yet.</p>
      )}
      <Modal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title="Add ministry member"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddMemberOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitMember(handleAddMember)} isLoading={isMemberSubmitting || addMember.isPending}>
              Add member
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmitMember(handleAddMember)}>
          <Select label="Member" options={personOptions} error={memberErrors.person_id?.message} {...registerMember('person_id')} />
          <Input label="Role" placeholder="e.g. Worship leader" {...registerMember('role')} />
          <Input label="Availability" placeholder="e.g. Sundays, 2nd & 4th week" {...registerMember('availability')} />
          <Select label="Status" options={membershipStatusOptions} {...registerMember('status')} />
        </form>
      </Modal>
    </div>
  )
}
