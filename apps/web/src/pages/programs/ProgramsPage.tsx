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
import { getProgramStatusTone, StatusPill } from '../../components/ui/StatusPill'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import type { Program } from '../../types'

const programSchema = z.object({
  title: z.string().min(1, 'Program title is required'),
  description: z.string().optional(),
  starts_at: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'completed', 'cancelled']),
})

type ProgramForm = z.infer<typeof programSchema>

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const fetchPrograms = async (): Promise<Program[]> => {
  const { data } = await api.get('/api/v1/programs')
  return unwrapList<Program>(data)
}

export const ProgramsPage = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProgramForm>({
    resolver: zodResolver(programSchema),
    defaultValues: { status: 'draft' },
  })

  const createProgram = useMutation({
    mutationFn: async (formData: ProgramForm) => {
      const { data } = await api.post('/api/v1/programs', formData)
      return unwrapData<Program>(data)
    },
    onSuccess: (program) => {
      void queryClient.invalidateQueries({ queryKey: ['programs'] })
      showToast('Program created', 'success')
      setIsModalOpen(false)
      reset()
      navigate(`/programs/${program.id}`)
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleCreate = async (formData: ProgramForm) => {
    await createProgram.mutateAsync(formData)
  }

  const handleRowClick = (id: number) => {
    navigate(`/programs/${id}`)
  }

  return (
    <div>
      <PageHeader
        title="Programs"
        description="Manage church programs and events"
        actions={<Button onClick={() => setIsModalOpen(true)}>New program</Button>}
      />
      {isLoading && <p className="text-sm text-ink-muted">Loading programs…</p>}
      {!isLoading && programs.length === 0 && (
        <EmptyState
          title="No programs yet"
          description="Create a program to manage teams and attendance."
          action={<Button onClick={() => setIsModalOpen(true)}>New program</Button>}
        />
      )}
      {!isLoading && programs.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Starts at</TableHead>
            <TableHead>Location</TableHead>
          </TableHeader>
          <TableBody>
            {programs.map((program) => (
              <TableRow key={program.id} onClick={() => handleRowClick(program.id)}>
                <TableCell className="font-medium">{program.title}</TableCell>
                <TableCell>
                  <StatusPill label={program.status} tone={getProgramStatusTone(program.status)} />
                </TableCell>
                <TableCell>
                  {program.starts_at
                    ? new Date(program.starts_at).toLocaleString()
                    : '—'}
                </TableCell>
                <TableCell>{program.location || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New program"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(handleCreate)} isLoading={isSubmitting || createProgram.isPending}>
              Create
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(handleCreate)}>
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" rows={3} {...register('description')} />
          <Input label="Starts at" type="datetime-local" {...register('starts_at')} />
          <Input label="Location" {...register('location')} />
          <Select label="Status" options={statusOptions} {...register('status')} />
        </form>
      </Modal>
    </div>
  )
}
