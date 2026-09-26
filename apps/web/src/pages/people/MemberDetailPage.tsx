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
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getPersonDisplayName, type Household, type Person } from '../../types'

const memberSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  preferred_name: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  first_contact_date: z.string().optional(),
  membership_status: z.enum(['new', 'contacted', 'follow_up', 'connected', 'member', 'inactive']),
  membership_date: z.string().optional(),
  baptism_status: z.string().optional(),
  pastoral_notes: z.string().optional(),
  household_id: z.string().optional(),
})

type MemberForm = z.infer<typeof memberSchema>

const membershipStatusOptions = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow up' },
  { value: 'connected', label: 'Connected' },
  { value: 'member', label: 'Member' },
  { value: 'inactive', label: 'Inactive' },
]

const fetchMember = async (id: string): Promise<Person> => {
  const { data } = await api.get(`/api/v1/people/${id}`)
  return unwrapData<Person>(data)
}

const fetchHouseholds = async (): Promise<Household[]> => {
  const { data } = await api.get('/api/v1/households')
  return unwrapList<Household>(data)
}

export const MemberDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()

  const { data: member, isLoading } = useQuery({
    queryKey: ['people', id],
    queryFn: () => fetchMember(id!),
    enabled: !!id,
  })

  const { data: households = [] } = useQuery({
    queryKey: ['households'],
    queryFn: fetchHouseholds,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
  })

  useEffect(() => {
    if (member) {
      reset({
        full_name: member.full_name,
        preferred_name: member.preferred_name || '',
        gender: member.gender || '',
        date_of_birth: member.date_of_birth ? member.date_of_birth.split('T')[0] : '',
        phone: member.phone || '',
        email: member.email || '',
        address: member.address || '',
        first_contact_date: member.first_contact_date ? member.first_contact_date.split('T')[0] : '',
        membership_status: member.membership_status,
        membership_date: member.membership_date ? member.membership_date.split('T')[0] : '',
        baptism_status: member.baptism_status || '',
        pastoral_notes: member.pastoral_notes || '',
        household_id: member.household_id ? String(member.household_id) : '',
      })
    }
  }, [member, reset])

  const updateMember = useMutation({
    mutationFn: async (formData: MemberForm) => {
      const payload = {
        ...formData,
        email: formData.email || null,
        household_id: formData.household_id ? Number(formData.household_id) : null,
      }
      const { data } = await api.patch(`/api/v1/people/${id}`, payload)
      return unwrapData<Person>(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['people'] })
      void queryClient.invalidateQueries({ queryKey: ['people', id] })
      showToast('Member updated successfully', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleSave = async (formData: MemberForm) => {
    await updateMember.mutateAsync(formData)
  }

  const householdOptions = [
    { value: '', label: 'No household' },
    ...households.map((h) => ({ value: String(h.id), label: h.name })),
  ]

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading member…</p>
  }

  if (!member) {
    return <p className="text-sm text-danger">Member not found.</p>
  }

  return (
    <div>
      <PageHeader
        title={getPersonDisplayName(member)}
        description="View and edit member details"
        actions={
          <Link to="/people/members">
            <Button variant="secondary">Back to list</Button>
          </Link>
        }
      />
      <form
        onSubmit={handleSubmit(handleSave)}
        className="max-w-2xl space-y-4 rounded-lg border border-border bg-surface p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Full name" error={errors.full_name?.message} {...register('full_name')} />
          <Input label="Preferred name" {...register('preferred_name')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Input label="Phone" type="tel" {...register('phone')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Gender" {...register('gender')} />
          <Input label="Date of birth" type="date" {...register('date_of_birth')} />
        </div>
        <Input label="Address" {...register('address')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Membership status" options={membershipStatusOptions} {...register('membership_status')} />
          <Input label="First contact date" type="date" {...register('first_contact_date')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Membership date" type="date" {...register('membership_date')} />
          <Input label="Baptism status" {...register('baptism_status')} />
        </div>
        <Select label="Household" options={householdOptions} {...register('household_id')} />
        <Textarea label="Pastoral notes" rows={3} {...register('pastoral_notes')} />
        {member.household && (
          <p className="text-sm text-ink-muted">
            Current household:{' '}
            <Link to={`/people/households/${member.household.id}`} className="text-accent hover:underline">
              {member.household.name}
            </Link>
          </p>
        )}
        <Button type="submit" isLoading={isSubmitting || updateMember.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
    </div>
  )
}
