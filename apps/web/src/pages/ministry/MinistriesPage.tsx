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
import { Select } from '../../components/ui/Select'
import { getMinistryActiveTone, StatusPill } from '../../components/ui/StatusPill'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import type { Ministry } from '../../types'

const ministrySchema = z.object({
  name: z.string().min(1, 'Ministry name is required'),
  description: z.string().optional(),
  is_active: z.enum(['true', 'false']),
})

type MinistryForm = z.infer<typeof ministrySchema>

const activeOptions = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

const fetchMinistries = async (): Promise<Ministry[]> => {
  const { data } = await api.get('/api/v1/ministries')
  return unwrapList<Ministry>(data)
}

export const MinistriesPage = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: ministries = [], isLoading } = useQuery({
    queryKey: ['ministries'],
    queryFn: fetchMinistries,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MinistryForm>({
    resolver: zodResolver(ministrySchema),
    defaultValues: { is_active: 'true' },
  })

  const createMinistry = useMutation({
    mutationFn: async (formData: MinistryForm) => {
      const { data } = await api.post('/api/v1/ministries', {
        name: formData.name,
        description: formData.description,
        is_active: formData.is_active === 'true',
      })
      return unwrapData<Ministry>(data)
    },
    onSuccess: (ministry) => {
      void queryClient.invalidateQueries({ queryKey: ['ministries'] })
      showToast('Ministry created', 'success')
      setIsModalOpen(false)
      reset()
      navigate(`/ministry/ministries/${ministry.id}`)
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleCreate = async (formData: MinistryForm) => {
    await createMinistry.mutateAsync(formData)
  }

  const handleRowClick = (id: number) => {
    navigate(`/ministry/ministries/${id}`)
  }

  return (
    <div>
      <PageHeader
        title="Ministries"
        description="Manage ministry teams and memberships"
        actions={<Button onClick={() => setIsModalOpen(true)}>New ministry</Button>}
      />
      {isLoading && <p className="text-sm text-ink-muted">Loading ministries…</p>}
      {!isLoading && ministries.length === 0 && (
        <EmptyState
          title="No ministries yet"
          description="Create a ministry to organize serving teams."
          action={<Button onClick={() => setIsModalOpen(true)}>New ministry</Button>}
        />
      )}
      {!isLoading && ministries.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Members</TableHead>
          </TableHeader>
          <TableBody>
            {ministries.map((ministry) => (
              <TableRow key={ministry.id} onClick={() => handleRowClick(ministry.id)}>
                <TableCell className="font-medium">{ministry.name}</TableCell>
                <TableCell>
                  <StatusPill
                    label={ministry.is_active ? 'Active' : 'Inactive'}
                    tone={getMinistryActiveTone(ministry.is_active)}
                  />
                </TableCell>
                <TableCell>{ministry.memberships_count ?? ministry.memberships?.length ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New ministry"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(handleCreate)} isLoading={isSubmitting || createMinistry.isPending}>
              Create
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(handleCreate)}>
          <Input label="Name" error={errors.name?.message} {...register('name')} />
          <Textarea label="Description" rows={3} {...register('description')} />
          <Select label="Status" options={activeOptions} {...register('is_active')} />
        </form>
      </Modal>
    </div>
  )
}
