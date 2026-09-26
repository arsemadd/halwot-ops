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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import { getPersonDisplayName, type Household, type Person } from '../../types'

const householdSchema = z.object({
  name: z.string().min(1, 'Household name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  emergency_contact: z.string().optional(),
  notes: z.string().optional(),
})

type HouseholdForm = z.infer<typeof householdSchema>

const roleOptions = [
  { value: 'head', label: 'Head' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'other', label: 'Other' },
]

const fetchHousehold = async (id: string): Promise<Household> => {
  const { data } = await api.get(`/api/v1/households/${id}`)
  return unwrapData<Household>(data)
}

const fetchPeople = async (): Promise<Person[]> => {
  const { data } = await api.get('/api/v1/people')
  return unwrapList<Person>(data)
}

export const HouseholdDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [selectedRole, setSelectedRole] = useState('other')

  const { data: household, isLoading } = useQuery({
    queryKey: ['households', id],
    queryFn: () => fetchHousehold(id!),
    enabled: !!id,
  })

  const { data: allPeople = [] } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
    enabled: isLinkModalOpen,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<HouseholdForm>({
    resolver: zodResolver(householdSchema),
  })

  useEffect(() => {
    if (household) {
      reset({
        name: household.name,
        address: household.address || '',
        phone: household.phone || '',
        emergency_contact: household.emergency_contact || '',
        notes: household.notes || '',
      })
    }
  }, [household, reset])

  const updateHousehold = useMutation({
    mutationFn: async (formData: HouseholdForm) => {
      const { data } = await api.patch(`/api/v1/households/${id}`, formData)
      return unwrapData<Household>(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['households'] })
      void queryClient.invalidateQueries({ queryKey: ['households', id] })
      showToast('Household updated successfully', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const linkMember = useMutation({
    mutationFn: async () => {
      await api.post(`/api/v1/households/${id}/members`, {
        person_id: Number(selectedPersonId),
        role: selectedRole,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['households', id] })
      void queryClient.invalidateQueries({ queryKey: ['people'] })
      showToast('Member linked to household', 'success')
      setIsLinkModalOpen(false)
      setSelectedPersonId('')
      setSelectedRole('other')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleSave = async (formData: HouseholdForm) => {
    await updateHousehold.mutateAsync(formData)
  }

  const handleLinkMember = async () => {
    if (!selectedPersonId) return
    await linkMember.mutateAsync()
  }

  const linkedMemberIds = new Set(household?.members?.map((m) => m.id) ?? [])
  const unlinkedPeople = allPeople.filter((p) => !linkedMemberIds.has(p.id))

  const personOptions = [
    { value: '', label: 'Select a member' },
    ...unlinkedPeople.map((p) => ({
      value: String(p.id),
      label: getPersonDisplayName(p),
    })),
  ]

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading household…</p>
  }

  if (!household) {
    return <p className="text-sm text-danger">Household not found.</p>
  }

  return (
    <div>
      <PageHeader
        title={household.name}
        description="Edit household details and manage linked members"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsLinkModalOpen(true)}>
              Link member
            </Button>
            <Link to="/people/households">
              <Button variant="ghost">Back to list</Button>
            </Link>
          </div>
        }
      />
      <form
        onSubmit={handleSubmit(handleSave)}
        className="mb-8 max-w-2xl space-y-4 rounded-lg border border-border bg-surface p-6"
      >
        <Input label="Household name" error={errors.name?.message} {...register('name')} />
        <Input label="Address" {...register('address')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Phone" type="tel" {...register('phone')} />
          <Input label="Emergency contact" {...register('emergency_contact')} />
        </div>
        <Textarea label="Notes" rows={3} {...register('notes')} />
        <Button type="submit" isLoading={isSubmitting || updateHousehold.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
      <h2 className="mb-4 text-lg font-semibold text-ink">Members</h2>
      {household.members && household.members.length > 0 ? (
        <Table>
          <TableHeader>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
          </TableHeader>
          <TableBody>
            {household.members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Link to={`/people/members/${member.id}`} className="font-medium text-accent hover:underline">
                    {getPersonDisplayName(member)}
                  </Link>
                </TableCell>
                <TableCell className="capitalize">{member.pivot?.role || '—'}</TableCell>
                <TableCell>{member.email || '—'}</TableCell>
                <TableCell className="capitalize">{member.membership_status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-ink-muted">No members linked to this household.</p>
      )}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Link member to household"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsLinkModalOpen(false)}>Cancel</Button>
            <Button onClick={handleLinkMember} isLoading={linkMember.isPending} disabled={!selectedPersonId}>
              Link member
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Member"
            options={personOptions}
            value={selectedPersonId}
            onChange={(e) => setSelectedPersonId(e.target.value)}
          />
          <Select
            label="Role in household"
            options={roleOptions}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
