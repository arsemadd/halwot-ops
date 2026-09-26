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
import { getConfirmationStatusTone, getProgramStatusTone, getProgramTaskStatusTone, StatusPill } from '../../components/ui/StatusPill'
import { Tab, TabList, TabPanel, Tabs } from '../../components/ui/Tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import {
  getPersonDisplayName,
  type ActivityLog,
  type AttendanceRecord,
  type Person,
  type Program,
  type ProgramBudget,
  type ProgramDocument,
  type ProgramTask,
} from '../../types'

const programSchema = z.object({
  title: z.string().min(1, 'Program title is required'),
  description: z.string().optional(),
  starts_at: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'completed', 'cancelled']),
})

const assignmentSchema = z.object({
  person_id: z.string().min(1, 'Select a member'),
  role: z.string().min(1, 'Role is required'),
  confirmation_status: z.enum(['pending', 'confirmed', 'declined']).optional(),
})

const attendanceSchema = z.object({
  person_id: z.string().min(1, 'Select a member'),
  status: z.enum(['present', 'absent', 'excused', 'visitor']),
  notes: z.string().optional(),
})

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required'),
  notes: z.string().optional(),
})

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  assignee_person_id: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'done', 'cancelled']).optional(),
  due_at: z.string().optional(),
})

const documentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  file_path: z.string().optional(),
})

type ProgramForm = z.infer<typeof programSchema>
type AssignmentForm = z.infer<typeof assignmentSchema>
type AttendanceForm = z.infer<typeof attendanceSchema>
type BudgetForm = z.infer<typeof budgetSchema>
type TaskForm = z.infer<typeof taskSchema>
type DocumentForm = z.infer<typeof documentSchema>

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const confirmationOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'declined', label: 'Declined' },
]

const attendanceStatusOptions = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'excused', label: 'Excused' },
  { value: 'visitor', label: 'Visitor' },
]

const taskStatusOptions = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

const fetchProgram = async (id: string): Promise<Program> => {
  const { data } = await api.get(`/api/v1/programs/${id}`)
  return unwrapData<Program>(data)
}

const fetchPeople = async (): Promise<Person[]> => {
  const { data } = await api.get('/api/v1/people')
  return unwrapList<Person>(data)
}

const fetchActivityLogs = async (programId: string): Promise<ActivityLog[]> => {
  const { data } = await api.get('/api/v1/activity-logs', {
    params: { subject_type: 'program', subject_id: programId },
  })
  return unwrapList<ActivityLog>(data)
}

const fetchAttendance = async (programId: string): Promise<AttendanceRecord[]> => {
  const { data } = await api.get(`/api/v1/programs/${programId}/attendance`)
  return unwrapList<AttendanceRecord>(data)
}

const fetchBudgets = async (programId: string): Promise<ProgramBudget[]> => {
  const { data } = await api.get(`/api/v1/programs/${programId}/budgets`)
  return unwrapList<ProgramBudget>(data)
}

const fetchTasks = async (programId: string): Promise<ProgramTask[]> => {
  const { data } = await api.get(`/api/v1/programs/${programId}/tasks`)
  return unwrapList<ProgramTask>(data)
}

const fetchDocuments = async (programId: string): Promise<ProgramDocument[]> => {
  const { data } = await api.get(`/api/v1/programs/${programId}/documents`)
  return unwrapList<ProgramDocument>(data)
}

export const ProgramDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false)

  const { data: program, isLoading } = useQuery({
    queryKey: ['programs', id],
    queryFn: () => fetchProgram(id!),
    enabled: !!id,
  })

  const { data: people = [] } = useQuery({
    queryKey: ['people'],
    queryFn: fetchPeople,
    enabled: isAssignmentModalOpen || isAttendanceModalOpen || isTaskModalOpen,
  })

  const { data: activityLogs = [] } = useQuery({
    queryKey: ['activity-logs', 'program', id],
    queryFn: () => fetchActivityLogs(id!),
    enabled: !!id,
  })

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['programs', id, 'attendance'],
    queryFn: () => fetchAttendance(id!),
    enabled: !!id,
  })

  const { data: budgets = [] } = useQuery({
    queryKey: ['programs', id, 'budgets'],
    queryFn: () => fetchBudgets(id!),
    enabled: !!id,
  })

  const { data: tasks = [] } = useQuery({
    queryKey: ['programs', id, 'tasks'],
    queryFn: () => fetchTasks(id!),
    enabled: !!id,
  })

  const { data: documents = [] } = useQuery({
    queryKey: ['programs', id, 'documents'],
    queryFn: () => fetchDocuments(id!),
    enabled: !!id,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProgramForm>({
    resolver: zodResolver(programSchema),
  })

  const {
    register: registerAssignment,
    handleSubmit: handleSubmitAssignment,
    reset: resetAssignment,
    formState: { errors: assignmentErrors, isSubmitting: isAssignmentSubmitting },
  } = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { confirmation_status: 'pending' },
  })

  const {
    register: registerAttendance,
    handleSubmit: handleSubmitAttendance,
    reset: resetAttendance,
    formState: { errors: attendanceErrors, isSubmitting: isAttendanceSubmitting },
  } = useForm<AttendanceForm>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { status: 'present' },
  })

  const {
    register: registerBudget,
    handleSubmit: handleSubmitBudget,
    reset: resetBudget,
    formState: { errors: budgetErrors, isSubmitting: isBudgetSubmitting },
  } = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
  })

  const {
    register: registerTask,
    handleSubmit: handleSubmitTask,
    reset: resetTask,
    formState: { errors: taskErrors, isSubmitting: isTaskSubmitting },
  } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { status: 'todo' },
  })

  const {
    register: registerDocument,
    handleSubmit: handleSubmitDocument,
    reset: resetDocument,
    formState: { errors: documentErrors, isSubmitting: isDocumentSubmitting },
  } = useForm<DocumentForm>({
    resolver: zodResolver(documentSchema),
  })

  useEffect(() => {
    if (program) {
      reset({
        title: program.title,
        description: program.description || '',
        starts_at: program.starts_at ? program.starts_at.slice(0, 16) : '',
        location: program.location || '',
        status: program.status,
      })
    }
  }, [program, reset])

  const updateProgram = useMutation({
    mutationFn: async (formData: ProgramForm) => {
      const { data } = await api.patch(`/api/v1/programs/${id}`, formData)
      return unwrapData<Program>(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['programs'] })
      void queryClient.invalidateQueries({ queryKey: ['programs', id] })
      showToast('Program updated', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const addAssignment = useMutation({
    mutationFn: async (formData: AssignmentForm) => {
      await api.post(`/api/v1/programs/${id}/assignments`, {
        person_id: Number(formData.person_id),
        role: formData.role,
        confirmation_status: formData.confirmation_status || 'pending',
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['programs', id] })
      showToast('Team assignment added', 'success')
      setIsAssignmentModalOpen(false)
      resetAssignment()
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const recordAttendance = useMutation({
    mutationFn: async (formData: AttendanceForm) => {
      await api.post(`/api/v1/programs/${id}/attendance`, {
        records: [{
          person_id: Number(formData.person_id),
          status: formData.status,
          notes: formData.notes || null,
        }],
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['programs', id] })
      void queryClient.invalidateQueries({ queryKey: ['programs', id, 'attendance'] })
      showToast('Attendance recorded', 'success')
      setIsAttendanceModalOpen(false)
      resetAttendance()
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const addBudget = useMutation({
    mutationFn: async (formData: BudgetForm) => {
      await api.post(`/api/v1/programs/${id}/budgets`, {
        category: formData.category,
        amount: Number(formData.amount),
        notes: formData.notes || null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['programs', id, 'budgets'] })
      showToast('Budget line added', 'success')
      setIsBudgetModalOpen(false)
      resetBudget()
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const deleteBudget = useMutation({
    mutationFn: async (budgetId: number) => {
      await api.delete(`/api/v1/programs/${id}/budgets/${budgetId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['programs', id, 'budgets'] })
      showToast('Budget line removed', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const addTask = useMutation({
    mutationFn: async (formData: TaskForm) => {
      await api.post(`/api/v1/programs/${id}/tasks`, {
        title: formData.title,
        description: formData.description || null,
        assignee_person_id: formData.assignee_person_id ? Number(formData.assignee_person_id) : null,
        status: formData.status || 'todo',
        due_at: formData.due_at || null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['programs', id, 'tasks'] })
      showToast('Task added', 'success')
      setIsTaskModalOpen(false)
      resetTask()
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number, status: ProgramTask['status'] }) => {
      await api.patch(`/api/v1/programs/${id}/tasks/${taskId}`, { status })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['programs', id, 'tasks'] })
      showToast('Task updated', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => {
      await api.delete(`/api/v1/programs/${id}/tasks/${taskId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['programs', id, 'tasks'] })
      showToast('Task removed', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const addDocument = useMutation({
    mutationFn: async (formData: DocumentForm) => {
      await api.post(`/api/v1/programs/${id}/documents`, {
        title: formData.title,
        description: formData.description || null,
        file_path: formData.file_path || null,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['programs', id, 'documents'] })
      showToast('Document added', 'success')
      setIsDocumentModalOpen(false)
      resetDocument()
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const deleteDocument = useMutation({
    mutationFn: async (docId: number) => {
      await api.delete(`/api/v1/programs/${id}/documents/${docId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['programs', id, 'documents'] })
      showToast('Document removed', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleSave = async (formData: ProgramForm) => {
    await updateProgram.mutateAsync(formData)
  }

  const personOptions = [
    { value: '', label: 'Select a member' },
    ...people.map((p) => ({
      value: String(p.id),
      label: getPersonDisplayName(p),
    })),
  ]

  const assignments = program?.assignments ?? []
  const records = attendanceRecords.length > 0 ? attendanceRecords : (program?.attendance_records ?? [])

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading program…</p>
  }

  if (!program) {
    return <p className="text-sm text-danger">Program not found.</p>
  }

  return (
    <div>
      <PageHeader
        title={program.title}
        description={program.description || undefined}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill label={program.status} tone={getProgramStatusTone(program.status)} />
            <Link to="/programs">
              <Button variant="secondary">Back to list</Button>
            </Link>
          </div>
        }
      />
      <Tabs defaultTab="overview">
        <TabList>
          <Tab value="overview">Overview</Tab>
          <Tab value="team">Team</Tab>
          <Tab value="attendance">Attendance</Tab>
          <Tab value="budget">Budget</Tab>
          <Tab value="tasks">Tasks</Tab>
          <Tab value="documents">Documents</Tab>
          <Tab value="activity">Activity</Tab>
        </TabList>
        <TabPanel value="overview">
          <form
            onSubmit={handleSubmit(handleSave)}
            className="max-w-2xl space-y-4 rounded-lg border border-border bg-surface p-6"
          >
            <Input label="Title" error={errors.title?.message} {...register('title')} />
            <Textarea label="Description" rows={3} {...register('description')} />
            <Input label="Starts at" type="datetime-local" {...register('starts_at')} />
            <Input label="Location" {...register('location')} />
            <Select label="Status" options={statusOptions} {...register('status')} />
            {program.ministry && (
              <p className="text-sm text-ink-muted">
                Ministry:{' '}
                <Link to={`/ministry/ministries/${program.ministry.id}`} className="text-accent hover:underline">
                  {program.ministry.name}
                </Link>
              </p>
            )}
            {program.leader && (
              <p className="text-sm text-ink-muted">
                Leader:{' '}
                <Link to={`/people/members/${program.leader.id}`} className="text-accent hover:underline">
                  {getPersonDisplayName(program.leader)}
                </Link>
              </p>
            )}
            <Button type="submit" isLoading={isSubmitting || updateProgram.isPending} disabled={!isDirty}>
              Save changes
            </Button>
          </form>
        </TabPanel>
        <TabPanel value="team">
          <div className="mb-4">
            <Button onClick={() => setIsAssignmentModalOpen(true)}>Add assignment</Button>
          </div>
          {assignments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Confirmation</TableHead>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      {assignment.person ? (
                        <Link to={`/people/members/${assignment.person.id}`} className="font-medium text-accent hover:underline">
                          {getPersonDisplayName(assignment.person)}
                        </Link>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{assignment.role}</TableCell>
                    <TableCell>
                      <StatusPill
                        label={assignment.confirmation_status}
                        tone={getConfirmationStatusTone(assignment.confirmation_status)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-ink-muted">No team assignments yet.</p>
          )}
        </TabPanel>
        <TabPanel value="attendance">
          <div className="mb-4">
            <Button onClick={() => setIsAttendanceModalOpen(true)}>Record attendance</Button>
          </div>
          {records.length > 0 ? (
            <Table>
              <TableHeader>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {record.person ? getPersonDisplayName(record.person) : '—'}
                    </TableCell>
                    <TableCell className="capitalize">{record.status}</TableCell>
                    <TableCell>{record.notes || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-ink-muted">No attendance records yet.</p>
          )}
        </TabPanel>
        <TabPanel value="budget">
          <div className="mb-4">
            <Button onClick={() => setIsBudgetModalOpen(true)}>Add budget line</Button>
          </div>
          {budgets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell>{budget.category}</TableCell>
                    <TableCell>{Number(budget.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{budget.notes || '—'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteBudget.mutate(budget.id)}
                        isLoading={deleteBudget.isPending}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-ink-muted">No budget lines yet.</p>
          )}
        </TabPanel>
        <TabPanel value="tasks">
          <div className="mb-4">
            <Button onClick={() => setIsTaskModalOpen(true)}>Add task</Button>
          </div>
          {tasks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableHead>Title</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-ink-muted">{task.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.assignee ? getPersonDisplayName(task.assignee) : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusPill label={task.status} tone={getProgramTaskStatusTone(task.status)} />
                    </TableCell>
                    <TableCell>
                      {task.due_at ? new Date(task.due_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {task.status !== 'done' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => updateTaskStatus.mutate({ taskId: task.id, status: 'done' })}
                            isLoading={updateTaskStatus.isPending}
                          >
                            Mark done
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteTask.mutate(task.id)}
                          isLoading={deleteTask.isPending}
                        >
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-ink-muted">No tasks yet.</p>
          )}
        </TabPanel>
        <TabPanel value="documents">
          <div className="mb-4">
            <Button onClick={() => setIsDocumentModalOpen(true)}>Add document</Button>
          </div>
          {documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableHead>Title</TableHead>
                <TableHead>File / URL</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Uploaded by</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      {doc.file_path ? (
                        <a href={doc.file_path} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                          {doc.file_path}
                        </a>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{doc.description || '—'}</TableCell>
                    <TableCell>{doc.uploaded_by?.name || '—'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteDocument.mutate(doc.id)}
                        isLoading={deleteDocument.isPending}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-ink-muted">No documents yet.</p>
          )}
        </TabPanel>
        <TabPanel value="activity">
          {activityLogs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
              </TableHeader>
              <TableBody>
                {activityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.description || log.action}</TableCell>
                    <TableCell>{log.user?.name || '—'}</TableCell>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-ink-muted">No activity recorded for this program.</p>
          )}
        </TabPanel>
      </Tabs>
      <Modal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        title="Add team assignment"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAssignmentModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitAssignment((d) => addAssignment.mutateAsync(d))}
              isLoading={isAssignmentSubmitting || addAssignment.isPending}
            >
              Add
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select label="Member" options={personOptions} error={assignmentErrors.person_id?.message} {...registerAssignment('person_id')} />
          <Input label="Role" error={assignmentErrors.role?.message} {...registerAssignment('role')} />
          <Select label="Confirmation" options={confirmationOptions} {...registerAssignment('confirmation_status')} />
        </form>
      </Modal>
      <Modal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        title="Record attendance"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAttendanceModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitAttendance((d) => recordAttendance.mutateAsync(d))}
              isLoading={isAttendanceSubmitting || recordAttendance.isPending}
            >
              Record
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select label="Member" options={personOptions} error={attendanceErrors.person_id?.message} {...registerAttendance('person_id')} />
          <Select label="Status" options={attendanceStatusOptions} {...registerAttendance('status')} />
          <Textarea label="Notes" rows={2} {...registerAttendance('notes')} />
        </form>
      </Modal>
      <Modal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Add budget line"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsBudgetModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitBudget((d) => addBudget.mutateAsync(d))}
              isLoading={isBudgetSubmitting || addBudget.isPending}
            >
              Add
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Category" error={budgetErrors.category?.message} {...registerBudget('category')} />
          <Input label="Amount" type="number" step="0.01" min="0" error={budgetErrors.amount?.message} {...registerBudget('amount')} />
          <Textarea label="Notes" rows={2} {...registerBudget('notes')} />
        </form>
      </Modal>
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title="Add task"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitTask((d) => addTask.mutateAsync(d))}
              isLoading={isTaskSubmitting || addTask.isPending}
            >
              Add
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Title" error={taskErrors.title?.message} {...registerTask('title')} />
          <Textarea label="Description" rows={2} {...registerTask('description')} />
          <Select label="Assignee" options={personOptions} {...registerTask('assignee_person_id')} />
          <Select label="Status" options={taskStatusOptions} {...registerTask('status')} />
          <Input label="Due date" type="date" {...registerTask('due_at')} />
        </form>
      </Modal>
      <Modal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        title="Add document"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDocumentModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSubmitDocument((d) => addDocument.mutateAsync(d))}
              isLoading={isDocumentSubmitting || addDocument.isPending}
            >
              Add
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Title" error={documentErrors.title?.message} {...registerDocument('title')} />
          <Input label="File path / URL" {...registerDocument('file_path')} />
          <Textarea label="Description" rows={2} {...registerDocument('description')} />
        </form>
      </Modal>
    </div>
  )
}
