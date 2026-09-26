import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
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
import { getPersonDisplayName, type DuplicateCheckResult, type Household, type Person, type User } from '../../types'

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
  owner_user_id: z.string().optional(),
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

const fetchHouseholds = async (): Promise<Household[]> => {
  const { data } = await api.get('/api/v1/households')
  return unwrapList<Household>(data)
}

const fetchUsers = async (): Promise<User[]> => {
  const { data } = await api.get('/api/v1/users')
  return unwrapList<User>(data)
}

export const RegisterMemberPage = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [duplicates, setDuplicates] = useState<Person[]>([])
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false)

  const { data: households = [] } = useQuery({
    queryKey: ['households'],
    queryFn: fetchHouseholds,
  })

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
    defaultValues: { membership_status: 'new' },
  })

  const householdOptions = [
    { value: '', label: 'No household' },
    ...households.map((h) => ({ value: String(h.id), label: h.name })),
  ]

  const ownerOptions = [
    { value: '', label: 'No follow-up owner' },
    ...users.map((u) => ({ value: String(u.id), label: u.name })),
  ]

  const checkDuplicates = async (phone?: string, email?: string) => {
    const { data } = await api.post('/api/v1/people/check-duplicates', {
      phone: phone || undefined,
      email: email || undefined,
    })
    return unwrapData<DuplicateCheckResult>(data)
  }

  const createMember = useMutation({
    mutationFn: async (formData: MemberForm) => {
      const payload = {
        ...formData,
        email: formData.email || null,
        household_id: formData.household_id ? Number(formData.household_id) : null,
        owner_user_id: formData.owner_user_id ? Number(formData.owner_user_id) : undefined,
      }
      const { data } = await api.post('/api/v1/people', payload)
      return unwrapData<Person>(data)
    },
    onSuccess: (person) => {
      void queryClient.invalidateQueries({ queryKey: ['people'] })
      showToast('Member registered successfully', 'success')
      navigate(`/people/members/${person.id}`)
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleCheckAndSubmit = async (formData: MemberForm) => {
    try {
      if (formData.phone || formData.email) {
        const result = await checkDuplicates(formData.phone, formData.email)
        if (result.has_duplicates && result.duplicates.length > 0) {
          setDuplicates(result.duplicates)
          setShowDuplicateWarning(true)
          return
        }
      }
      await createMember.mutateAsync(formData)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  const handleConfirmCreate = async () => {
    setShowDuplicateWarning(false)
    await createMember.mutateAsync(getValues())
  }

  return (
    <div>
      <PageHeader
        title="Register member"
        description="Add a new person to the church directory"
        actions={
          <Link to="/people/members">
            <Button variant="secondary">Cancel</Button>
          </Link>
        }
      />
      {showDuplicateWarning && (
        <div className="mb-6 rounded-lg border border-warning/40 bg-warning-light p-4">
          <h3 className="font-medium text-warning">Possible duplicates found</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Matching records exist for the same phone or email:
          </p>
          <ul className="mt-3 space-y-2">
            {duplicates.map((dup) => (
              <li key={dup.id} className="text-sm">
                <Link
                  to={`/people/members/${dup.id}`}
                  className="font-medium text-accent hover:underline"
                >
                  {getPersonDisplayName(dup)}
                </Link>
                {dup.email && <span className="text-ink-muted"> — {dup.email}</span>}
                {dup.phone && <span className="text-ink-muted"> — {dup.phone}</span>}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleConfirmCreate} isLoading={createMember.isPending}>
              Register anyway
            </Button>
            <Button variant="secondary" onClick={() => setShowDuplicateWarning(false)}>
              Review duplicates
            </Button>
          </div>
        </div>
      )}
      <form
        onSubmit={handleSubmit(handleCheckAndSubmit)}
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Household" options={householdOptions} {...register('household_id')} />
          <Select label="Follow-up owner" options={ownerOptions} {...register('owner_user_id')} />
        </div>
        <Textarea label="Pastoral notes" rows={3} {...register('pastoral_notes')} />
        <Button type="submit" isLoading={isSubmitting || createMember.isPending}>
          Register member
        </Button>
      </form>
    </div>
  )
}
