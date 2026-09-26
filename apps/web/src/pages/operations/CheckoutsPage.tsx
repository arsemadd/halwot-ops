import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
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
import { getAssetCheckoutStatusTone, StatusPill } from '../../components/ui/StatusPill'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import type { Asset, AssetCheckout, Program } from '../../types'

const checkoutSchema = z.object({
  asset_id: z.string().min(1, 'Select an asset'),
  program_id: z.string().optional(),
  purpose: z.string().optional(),
  expected_return_at: z.string().optional(),
})

const returnSchema = z.object({
  return_condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  return_notes: z.string().optional(),
})

type CheckoutForm = z.infer<typeof checkoutSchema>
type ReturnForm = z.infer<typeof returnSchema>

const statusFilterOptions = [
  { value: '', label: 'All statuses' },
  { value: 'requested', label: 'Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'returned', label: 'Returned' },
  { value: 'cancelled', label: 'Cancelled' },
]

const conditionOptions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

const fetchCheckouts = async (status: string): Promise<AssetCheckout[]> => {
  const params: Record<string, string> = {}
  if (status) params.status = status
  const { data } = await api.get('/api/v1/checkouts', { params })
  return unwrapList<AssetCheckout>(data)
}

const fetchAvailableAssets = async (): Promise<Asset[]> => {
  const { data } = await api.get('/api/v1/assets', { params: { status: 'available' } })
  return unwrapList<Asset>(data)
}

const fetchPrograms = async (): Promise<Program[]> => {
  const { data } = await api.get('/api/v1/programs')
  return unwrapList<Program>(data)
}

export const CheckoutsPage = () => {
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [returnCheckoutId, setReturnCheckoutId] = useState<number | null>(null)

  const { data: checkouts = [], isLoading } = useQuery({
    queryKey: ['checkouts', statusFilter],
    queryFn: () => fetchCheckouts(statusFilter),
  })

  const { data: assets = [] } = useQuery({
    queryKey: ['assets', 'available'],
    queryFn: fetchAvailableAssets,
    enabled: isModalOpen,
  })

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: fetchPrograms,
    enabled: isModalOpen,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  })

  const {
    register: registerReturn,
    handleSubmit: handleSubmitReturn,
    reset: resetReturn,
    formState: { errors: returnErrors, isSubmitting: isReturnSubmitting },
  } = useForm<ReturnForm>({
    resolver: zodResolver(returnSchema),
    defaultValues: { return_condition: 'good' },
  })

  const invalidateCheckouts = () => {
    void queryClient.invalidateQueries({ queryKey: ['checkouts'] })
    void queryClient.invalidateQueries({ queryKey: ['assets'] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const createCheckout = useMutation({
    mutationFn: async (formData: CheckoutForm) => {
      const payload = {
        asset_id: Number(formData.asset_id),
        program_id: formData.program_id ? Number(formData.program_id) : undefined,
        purpose: formData.purpose || undefined,
        expected_return_at: formData.expected_return_at || undefined,
      }
      const { data } = await api.post('/api/v1/checkouts', payload)
      return unwrapData<AssetCheckout>(data)
    },
    onSuccess: () => {
      invalidateCheckouts()
      showToast('Checkout request created', 'success')
      setIsModalOpen(false)
      reset()
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const approveCheckout = useMutation({
    mutationFn: async (checkoutId: number) => {
      const { data } = await api.patch(`/api/v1/checkouts/${checkoutId}/approve`)
      return unwrapData<AssetCheckout>(data)
    },
    onSuccess: () => {
      invalidateCheckouts()
      showToast('Checkout approved', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const performCheckout = useMutation({
    mutationFn: async (checkoutId: number) => {
      const { data } = await api.patch(`/api/v1/checkouts/${checkoutId}/checkout`)
      return unwrapData<AssetCheckout>(data)
    },
    onSuccess: () => {
      invalidateCheckouts()
      showToast('Asset checked out', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const returnCheckout = useMutation({
    mutationFn: async ({ checkoutId, formData }: { checkoutId: number, formData: ReturnForm }) => {
      const { data } = await api.patch(`/api/v1/checkouts/${checkoutId}/return`, formData)
      return unwrapData<AssetCheckout>(data)
    },
    onSuccess: () => {
      invalidateCheckouts()
      showToast('Asset returned', 'success')
      setReturnCheckoutId(null)
      resetReturn()
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const cancelCheckout = useMutation({
    mutationFn: async (checkoutId: number) => {
      const { data } = await api.patch(`/api/v1/checkouts/${checkoutId}/cancel`)
      return unwrapData<AssetCheckout>(data)
    },
    onSuccess: () => {
      invalidateCheckouts()
      showToast('Checkout cancelled', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const assetOptions = [
    { value: '', label: 'Select an asset' },
    ...assets.map((a) => ({ value: String(a.id), label: `${a.code} — ${a.name}` })),
  ]

  const programOptions = [
    { value: '', label: 'No program' },
    ...programs.map((p) => ({ value: String(p.id), label: p.title })),
  ]

  const renderActions = (checkout: AssetCheckout) => {
    const isPending = approveCheckout.isPending || performCheckout.isPending || cancelCheckout.isPending
    return (
      <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
        {checkout.status === 'requested' && (
          <>
            <Button
              size="sm"
              variant="secondary"
              disabled={isPending}
              onClick={() => approveCheckout.mutate(checkout.id)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => performCheckout.mutate(checkout.id)}
            >
              Checkout
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={isPending}
              onClick={() => cancelCheckout.mutate(checkout.id)}
            >
              Cancel
            </Button>
          </>
        )}
        {checkout.status === 'approved' && (
          <>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => performCheckout.mutate(checkout.id)}
            >
              Checkout
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={isPending}
              onClick={() => cancelCheckout.mutate(checkout.id)}
            >
              Cancel
            </Button>
          </>
        )}
        {checkout.status === 'checked_out' && (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => setReturnCheckoutId(checkout.id)}
          >
            Return
          </Button>
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Checkouts"
        description="Request, approve, and track asset checkouts"
        actions={<Button onClick={() => setIsModalOpen(true)}>New request</Button>}
      />
      <div className="mb-4 w-full sm:w-48">
        <Select
          options={statusFilterOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        />
      </div>
      {isLoading && <p className="text-sm text-ink-muted">Loading checkouts…</p>}
      {!isLoading && checkouts.length === 0 && (
        <EmptyState
          title="No checkout requests"
          description="Create a request when someone needs equipment."
          action={<Button onClick={() => setIsModalOpen(true)}>New request</Button>}
        />
      )}
      {!isLoading && checkouts.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Asset</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Requested by</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>Expected return</TableHead>
            <TableHead>Actions</TableHead>
          </TableHeader>
          <TableBody>
            {checkouts.map((checkout) => (
              <TableRow key={checkout.id}>
                <TableCell>
                  {checkout.asset ? (
                    <Link
                      to={`/operations/assets/${checkout.asset.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {checkout.asset.code} — {checkout.asset.name}
                    </Link>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <StatusPill label={checkout.status} tone={getAssetCheckoutStatusTone(checkout.status)} />
                </TableCell>
                <TableCell>{checkout.requested_by?.name || '—'}</TableCell>
                <TableCell>{checkout.program?.title || '—'}</TableCell>
                <TableCell>
                  {checkout.expected_return_at
                    ? new Date(checkout.expected_return_at).toLocaleDateString()
                    : '—'}
                </TableCell>
                <TableCell>{renderActions(checkout)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New checkout request"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit((d) => createCheckout.mutateAsync(d))} isLoading={isSubmitting || createCheckout.isPending}>
              Submit request
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit((d) => createCheckout.mutateAsync(d))}>
          <Select label="Asset" options={assetOptions} error={errors.asset_id?.message} {...register('asset_id')} />
          <Select label="Program" options={programOptions} {...register('program_id')} />
          <Input label="Purpose" {...register('purpose')} />
          <Input label="Expected return" type="datetime-local" {...register('expected_return_at')} />
        </form>
      </Modal>
      <Modal
        isOpen={returnCheckoutId !== null}
        onClose={() => setReturnCheckoutId(null)}
        title="Return asset"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReturnCheckoutId(null)}>Cancel</Button>
            <Button
              onClick={handleSubmitReturn((d) => returnCheckout.mutateAsync({ checkoutId: returnCheckoutId!, formData: d }))}
              isLoading={isReturnSubmitting || returnCheckout.isPending}
            >
              Confirm return
            </Button>
          </>
        }
      >
        <form className="space-y-4">
          <Select label="Return condition" options={conditionOptions} error={returnErrors.return_condition?.message} {...registerReturn('return_condition')} />
          <Textarea label="Return notes" rows={2} {...registerReturn('return_notes')} />
        </form>
      </Modal>
    </div>
  )
}
