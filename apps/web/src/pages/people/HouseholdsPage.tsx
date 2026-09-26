import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { api, getErrorMessage } from '../../lib/api'
import { queryClient } from '../../lib/query'
import { unwrapData, unwrapList } from '../../lib/unwrap'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import type { Household } from '../../types'

const householdSchema = z.object({
  name: z.string().min(1, 'Household name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  emergency_contact: z.string().optional(),
  notes: z.string().optional(),
})

type HouseholdForm = z.infer<typeof householdSchema>

const fetchHouseholds = async (): Promise<Household[]> => {
  const { data } = await api.get('/api/v1/households')
  return unwrapList<Household>(data)
}

export const HouseholdsPage = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: households = [], isLoading } = useQuery({
    queryKey: ['households'],
    queryFn: fetchHouseholds,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HouseholdForm>({
    resolver: zodResolver(householdSchema),
  })

  const createHousehold = useMutation({
    mutationFn: async (formData: HouseholdForm) => {
      const { data } = await api.post('/api/v1/households', formData)
      return unwrapData<Household>(data)
    },
    onSuccess: (household) => {
      void queryClient.invalidateQueries({ queryKey: ['households'] })
      showToast('Household created successfully', 'success')
      setIsModalOpen(false)
      reset()
      navigate(`/people/households/${household.id}`)
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleOpenModal = () => {
    reset({ name: '', address: '', phone: '', emergency_contact: '', notes: '' })
    setIsModalOpen(true)
  }

  const handleCreate = async (formData: HouseholdForm) => {
    await createHousehold.mutateAsync(formData)
  }

  const handleRowClick = (id: number) => {
    navigate(`/people/households/${id}`)
  }

  return (
    <div>
      <PageHeader
        title="Households"
        description="Manage family units and linked members"
        actions={<Button onClick={handleOpenModal}>New household</Button>}
      />
      {isLoading && <p className="text-sm text-ink-muted">Loading households…</p>}
      {!isLoading && households.length === 0 && (
        <EmptyState
          title="No households yet"
          description="Create a household to group members together."
          action={<Button onClick={handleOpenModal}>New household</Button>}
        />
      )}
      {!isLoading && households.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Members</TableHead>
          </TableHeader>
          <TableBody>
            {households.map((household) => (
              <TableRow key={household.id} onClick={() => handleRowClick(household.id)}>
                <TableCell className="font-medium">{household.name}</TableCell>
                <TableCell>{household.address || '—'}</TableCell>
                <TableCell>{household.phone || '—'}</TableCell>
                <TableCell>{household.members_count ?? household.members?.length ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New household"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(handleCreate)} isLoading={isSubmitting || createHousehold.isPending}>
              Create
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(handleCreate)}>
          <Input label="Household name" error={errors.name?.message} {...register('name')} />
          <Input label="Address" {...register('address')} />
          <Input label="Phone" type="tel" {...register('phone')} />
          <Input label="Emergency contact" {...register('emergency_contact')} />
          <Textarea label="Notes" rows={3} {...register('notes')} />
        </form>
      </Modal>
    </div>
  )
}
