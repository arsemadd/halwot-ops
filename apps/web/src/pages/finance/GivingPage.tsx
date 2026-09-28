import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api, getErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { hasPermission } from '../../lib/permissions'
import { queryClient } from '../../lib/query'
import { unwrapData, unwrapList } from '../../lib/unwrap'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import type { GivingRecord, GivingSummary, Person } from '../../types'
import { getPersonDisplayName } from '../../types'

const schema = z.object({
  type: z.enum(['tithe', 'offering', 'special', 'other']),
  amount: z.string().min(1, 'Amount is required'),
  given_on: z.string().min(1, 'Date is required'),
  method: z.enum(['cash', 'bank', 'mobile', 'card', 'other']),
  fund: z.string().optional(),
  person_id: z.string().optional(),
  is_anonymous: z.boolean().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const fetchGiving = async (type: string): Promise<GivingRecord[]> => {
  const params: Record<string, string> = {}
  if (type) params.type = type
  const { data } = await api.get('/api/v1/giving', { params })
  return unwrapList<GivingRecord>(data)
}

const fetchSummary = async (): Promise<GivingSummary> => {
  const { data } = await api.get('/api/v1/giving/summary')
  return unwrapData<GivingSummary>(data)
}

const fetchPeople = async (): Promise<Person[]> => {
  const { data } = await api.get('/api/v1/people', { params: { per_page: 100 } })
  return unwrapList<Person>(data)
}

const formatAmount = (amount: string, currency = 'ETB') =>
  `${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}`

export const GivingPage = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const canCreate = hasPermission(user?.permissions, 'giving.create')
  const [typeFilter, setTypeFilter] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['giving', typeFilter],
    queryFn: () => fetchGiving(typeFilter),
  })

  const { data: summary } = useQuery({
    queryKey: ['giving-summary'],
    queryFn: fetchSummary,
  })

  const { data: people = [] } = useQuery({
    queryKey: ['people-lite'],
    queryFn: fetchPeople,
    enabled: isOpen,
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'tithe',
      method: 'cash',
      given_on: new Date().toISOString().slice(0, 10),
      is_anonymous: false,
    },
  })

  const isAnonymous = watch('is_anonymous')

  const maxMonthly = useMemo(() => {
    if (!summary?.monthly?.length) return 1
    return Math.max(...summary.monthly.map((m) => Number(m.total) || 0), 1)
  }, [summary])

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      await api.post('/api/v1/giving', {
        type: values.type,
        amount: Number(values.amount),
        given_on: values.given_on,
        method: values.method,
        fund: values.fund || null,
        notes: values.notes || null,
        is_anonymous: !!values.is_anonymous,
        person_id: values.is_anonymous || !values.person_id ? null : Number(values.person_id),
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['giving'] })
      void queryClient.invalidateQueries({ queryKey: ['giving-summary'] })
      void queryClient.invalidateQueries({ queryKey: ['reports'] })
      showToast('Giving recorded', 'success')
      setIsOpen(false)
      reset({
        type: 'tithe',
        method: 'cash',
        given_on: new Date().toISOString().slice(0, 10),
        is_anonymous: false,
        amount: '',
        fund: '',
        notes: '',
        person_id: '',
      })
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  })

  return (
    <div>
      <PageHeader
        title="Giving & tithes"
        description="Finance-only records — kept off general member profiles"
        actions={
          canCreate ? (
            <Button onClick={() => setIsOpen(true)} aria-label="Record giving">
              Record giving
            </Button>
          ) : undefined
        }
      />

      {summary && (
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">This period</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {formatAmount(summary.total, summary.currency)}
            </p>
            <p className="mt-1 text-sm text-ink-muted">{summary.record_count} records</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 md:col-span-2">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-subtle">
              Last 6 months
            </p>
            <div className="flex h-24 items-end gap-2">
              {(summary.monthly ?? []).map((point) => (
                <div key={point.month} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-accent/80"
                    style={{
                      height: `${Math.max(8, (Number(point.total) / maxMonthly) * 100)}%`,
                    }}
                    title={formatAmount(point.total)}
                  />
                  <span className="text-[10px] text-ink-subtle">{point.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 max-w-xs">
        <Select
          label="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { value: '', label: 'All types' },
            { value: 'tithe', label: 'Tithe' },
            { value: 'offering', label: 'Offering' },
            { value: 'special', label: 'Special' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading giving records…</p>
      ) : records.length === 0 ? (
        <EmptyState
          title="No giving recorded"
          description="Finance users can record tithes and offerings here."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Giver</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Fund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{record.given_on}</TableCell>
                <TableCell className="capitalize">{record.type}</TableCell>
                <TableCell>
                  {record.is_anonymous
                    ? 'Anonymous'
                    : record.person
                      ? getPersonDisplayName(record.person)
                      : '—'}
                </TableCell>
                <TableCell>{formatAmount(record.amount, record.currency)}</TableCell>
                <TableCell className="capitalize">{record.method}</TableCell>
                <TableCell>{record.fund || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Record giving">
        <form
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
          className="space-y-4"
        >
          <Select
            label="Type"
            error={errors.type?.message}
            {...register('type')}
            options={[
              { value: 'tithe', label: 'Tithe' },
              { value: 'offering', label: 'Offering' },
              { value: 'special', label: 'Special' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Input
            label="Amount (ETB)"
            type="number"
            step="0.01"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Date"
            type="date"
            error={errors.given_on?.message}
            {...register('given_on')}
          />
          <Select
            label="Method"
            {...register('method')}
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'bank', label: 'Bank' },
              { value: 'mobile', label: 'Mobile money' },
              { value: 'card', label: 'Card' },
              { value: 'other', label: 'Other' },
            ]}
          />
          <Input label="Fund (optional)" {...register('fund')} />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={!!isAnonymous}
              onChange={(e) => setValue('is_anonymous', e.target.checked)}
            />
            Anonymous gift
          </label>
          {!isAnonymous && (
            <Select
              label="Linked person (optional)"
              {...register('person_id')}
              options={[
                { value: '', label: 'Not linked' },
                ...people.map((person) => ({
                  value: String(person.id),
                  label: getPersonDisplayName(person),
                })),
              ]}
            />
          )}
          <Textarea label="Notes (finance only)" rows={3} {...register('notes')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || createMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
