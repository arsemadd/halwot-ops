import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { getExpenseStatusTone, StatusPill } from '../../components/ui/StatusPill'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import type { Expense, Ministry, Program } from '../../types'

const expenseSchema = z.object({
  category: z.enum(['media', 'worship', 'youth', 'facilities', 'admin', 'transport', 'other']),
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().min(1, 'Description is required'),
  program_id: z.string().optional(),
  ministry_id: z.string().optional(),
  receipt_path: z.string().optional(),
})

const rejectSchema = z.object({
  rejection_reason: z.string().min(1, 'Rejection reason is required'),
})

type ExpenseForm = z.infer<typeof expenseSchema>
type RejectForm = z.infer<typeof rejectSchema>

const statusFilterOptions = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'reconciled', label: 'Reconciled' },
  { value: 'rejected', label: 'Rejected' },
]

const categoryOptions = [
  { value: 'media', label: 'Media' },
  { value: 'worship', label: 'Worship' },
  { value: 'youth', label: 'Youth' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'admin', label: 'Admin' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
]

const fetchExpenses = async (status: string): Promise<Expense[]> => {
  const params: Record<string, string> = {}
  if (status) params.status = status
  const { data } = await api.get('/api/v1/expenses', { params })
  return unwrapList<Expense>(data)
}

const fetchPrograms = async (): Promise<Program[]> => {
  const { data } = await api.get('/api/v1/programs')
  return unwrapList<Program>(data)
}

const fetchMinistries = async (): Promise<Ministry[]> => {
  const { data } = await api.get('/api/v1/ministries')
  return unwrapList<Ministry>(data)
}

const formatAmount = (amount: string, currency: string) =>
  `${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`

export const ExpensesPage = () => {
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [rejectExpenseId, setRejectExpenseId] = useState<number | null>(null)

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', statusFilter],
    queryFn: () => fetchExpenses(statusFilter),
  })

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
    enabled: isModalOpen,
  })

  const { data: ministries = [] } = useQuery({
    queryKey: ['ministries'],
    queryFn: fetchMinistries,
    enabled: isModalOpen,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: 'other' },
  })

  const {
    register: registerReject,
    handleSubmit: handleSubmitReject,
    reset: resetReject,
    formState: { errors: rejectErrors, isSubmitting: isRejectSubmitting },
  } = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
  })

  const invalidateExpenses = () => {
    void queryClient.invalidateQueries({ queryKey: ['expenses'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const createExpense = useMutation({
    mutationFn: async (formData: ExpenseForm) => {
      const payload = {
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description,
        program_id: formData.program_id ? Number(formData.program_id) : undefined,
        ministry_id: formData.ministry_id ? Number(formData.ministry_id) : undefined,
        receipt_path: formData.receipt_path || undefined,
      }
      const { data } = await api.post('/api/v1/expenses', payload)
      return unwrapData<Expense>(data)
    },
    onSuccess: () => {
      invalidateExpenses()
      showToast('Expense draft created', 'success')
      setIsModalOpen(false)
      reset()
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const submitExpense = useMutation({
    mutationFn: async (expenseId: number) => {
      const { data } = await api.patch(`/api/v1/expenses/${expenseId}/submit`)
      return unwrapData<Expense>(data)
    },
    onSuccess: () => {
      invalidateExpenses()
      showToast('Expense submitted', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const approveExpense = useMutation({
    mutationFn: async (expenseId: number) => {
      const { data } = await api.patch(`/api/v1/expenses/${expenseId}/approve`)
      return unwrapData<Expense>(data)
    },
    onSuccess: () => {
      invalidateExpenses()
      showToast('Expense approved', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const rejectExpense = useMutation({
    mutationFn: async ({ expenseId, formData }: { expenseId: number, formData: RejectForm }) => {
      const { data } = await api.patch(`/api/v1/expenses/${expenseId}/reject`, formData)
      return unwrapData<Expense>(data)
    },
    onSuccess: () => {
      invalidateExpenses()
      showToast('Expense rejected', 'success')
      setRejectExpenseId(null)
      resetReject()
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const markPaid = useMutation({
    mutationFn: async (expenseId: number) => {
      const { data } = await api.patch(`/api/v1/expenses/${expenseId}/mark-paid`)
      return unwrapData<Expense>(data)
    },
    onSuccess: () => {
      invalidateExpenses()
      showToast('Expense marked as paid', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const reconcileExpense = useMutation({
    mutationFn: async (expenseId: number) => {
      const { data } = await api.patch(`/api/v1/expenses/${expenseId}/reconcile`)
      return unwrapData<Expense>(data)
    },
    onSuccess: () => {
      invalidateExpenses()
      showToast('Expense reconciled', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const programOptions = [
    { value: '', label: 'No program' },
    ...programs.map((p) => ({ value: String(p.id), label: p.title })),
  ]

  const ministryOptions = [
    { value: '', label: 'No ministry' },
    ...ministries.map((m) => ({ value: String(m.id), label: m.name })),
  ]

  const isActionPending =
    submitExpense.isPending
    || approveExpense.isPending
    || rejectExpense.isPending
    || markPaid.isPending
    || reconcileExpense.isPending

  const renderActions = (expense: Expense) => (
    <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
      {(expense.status === 'draft' || expense.status === 'rejected') && (
        <Button
          size="sm"
          disabled={isActionPending}
          onClick={() => submitExpense.mutate(expense.id)}
        >
          Submit
        </Button>
      )}
      {expense.status === 'submitted' && (
        <>
          <Button
            size="sm"
            disabled={isActionPending}
            onClick={() => approveExpense.mutate(expense.id)}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="danger"
            disabled={isActionPending}
            onClick={() => setRejectExpenseId(expense.id)}
          >
            Reject
          </Button>
        </>
      )}
      {expense.status === 'approved' && (
        <Button
          size="sm"
          disabled={isActionPending}
          onClick={() => markPaid.mutate(expense.id)}
        >
          Mark paid
        </Button>
      )}
      {expense.status === 'paid' && (
        <Button
          size="sm"
          disabled={isActionPending}
          onClick={() => reconcileExpense.mutate(expense.id)}
        >
          Reconcile
        </Button>
      )}
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Submit and approve operational expense requests"
        actions={<Button onClick={() => setIsModalOpen(true)}>New expense</Button>}
      />
      <div className="mb-4 w-full sm:w-48">
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        />
      </div>
      {isLoading && <p className="text-sm text-ink-muted">Loading expenses…</p>}
      {!isLoading && expenses.length === 0 && (
        <EmptyState
          title="No expenses yet"
          description="Create a draft expense to start the approval workflow."
          action={<Button onClick={() => setIsModalOpen(true)}>New expense</Button>}
        />
      )}
      {!isLoading && expenses.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Requested by</TableHead>
            <TableHead>Actions</TableHead>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="capitalize">{expense.category}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{formatAmount(expense.amount, expense.currency)}</TableCell>
                <TableCell>
                  <StatusPill label={expense.status} tone={getExpenseStatusTone(expense.status)} />
                </TableCell>
                <TableCell>{expense.program?.title || '—'}</TableCell>
                <TableCell>{expense.requested_by?.name || '—'}</TableCell>
                <TableCell>{renderActions(expense)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New expense draft"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit((d) => createExpense.mutateAsync(d))} isLoading={isSubmitting || createExpense.isPending}>
              Create draft
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit((d) => createExpense.mutateAsync(d))}>
          <Select label="Category" options={categoryOptions} error={errors.category?.message} {...register('category')} />
          <Input label="Amount" type="number" step="0.01" min="0" error={errors.amount?.message} {...register('amount')} />
          <Textarea label="Description" rows={3} error={errors.description?.message} {...register('description')} />
          <Select label="Program" options={programOptions} {...register('program_id')} />
          <Select label="Ministry" options={ministryOptions} {...register('ministry_id')} />
          <Input label="Receipt path / URL" {...register('receipt_path')} />
        </form>
      </Modal>
      <Modal
        isOpen={rejectExpenseId !== null}
        onClose={() => setRejectExpenseId(null)}
        title="Reject expense"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectExpenseId(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleSubmitReject((d) => rejectExpense.mutateAsync({ expenseId: rejectExpenseId!, formData: d }))}
              isLoading={isRejectSubmitting || rejectExpense.isPending}
            >
              Reject
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Textarea label="Rejection reason" rows={3} error={rejectErrors.rejection_reason?.message} {...registerReject('rejection_reason')} />
        </form>
      </Modal>
    </div>
  )
}
