import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { z } from 'zod'
import { api, getErrorMessage } from '../../lib/api'
import { queryClient } from '../../lib/query'
import { unwrapData } from '../../lib/unwrap'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { getAssetCheckoutStatusTone, getAssetStatusTone, StatusPill } from '../../components/ui/StatusPill'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { useToast } from '../../components/ui/Toast'
import type { Asset } from '../../types'

const updateSchema = z.object({
  status: z.enum(['available', 'reserved', 'checked_out', 'in_use', 'returned', 'inspection', 'maintenance', 'retired']),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']),
})

type UpdateForm = z.infer<typeof updateSchema>

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'in_use', label: 'In use' },
  { value: 'returned', label: 'Returned' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
]

const conditionOptions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

const fetchAsset = async (id: string): Promise<Asset> => {
  const { data } = await api.get(`/api/v1/assets/${id}`)
  return unwrapData<Asset>(data)
}

export const AssetDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { showToast } = useToast()

  const { data: asset, isLoading } = useQuery({
    queryKey: ['assets', id],
    queryFn: () => fetchAsset(id!),
    enabled: !!id,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
  })

  useEffect(() => {
    if (asset) {
      reset({
        status: asset.status,
        condition: asset.condition,
      })
    }
  }, [asset, reset])

  const updateAsset = useMutation({
    mutationFn: async (formData: UpdateForm) => {
      const { data } = await api.patch(`/api/v1/assets/${id}`, formData)
      return unwrapData<Asset>(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['assets'] })
      void queryClient.invalidateQueries({ queryKey: ['assets', id] })
      showToast('Asset updated', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleSave = async (formData: UpdateForm) => {
    await updateAsset.mutateAsync(formData)
  }

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading asset…</p>
  }

  if (!asset) {
    return <p className="text-sm text-danger">Asset not found.</p>
  }

  const checkouts = asset.checkouts ?? []

  return (
    <div>
      <PageHeader
        title={`${asset.code} — ${asset.name}`}
        description={`${asset.category.replace(/_/g, ' ')} · ${asset.brand || '—'} ${asset.model || ''}`.trim()}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill label={asset.status} tone={getAssetStatusTone(asset.status)} />
            <Link to="/operations/assets">
              <Button variant="secondary">Back to list</Button>
            </Link>
            <Link to="/operations/checkouts">
              <Button variant="secondary">View checkouts</Button>
            </Link>
          </div>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleSubmit(handleSave)}
          className="space-y-4 rounded-lg border border-border bg-surface p-6"
        >
          <h2 className="text-sm font-semibold text-ink">Status & condition</h2>
          <Select label="Status" options={statusOptions} error={errors.status?.message} {...register('status')} />
          <Select label="Condition" options={conditionOptions} error={errors.condition?.message} {...register('condition')} />
          {asset.location && (
            <p className="text-sm text-ink-muted">Location: {asset.location.name}</p>
          )}
          {asset.custodian_ministry && (
            <p className="text-sm text-ink-muted">
              Custodian:{' '}
              <Link to={`/ministry/ministries/${asset.custodian_ministry.id}`} className="text-accent hover:underline">
                {asset.custodian_ministry.name}
              </Link>
            </p>
          )}
          {asset.notes && (
            <p className="text-sm text-ink-muted">Notes: {asset.notes}</p>
          )}
          <Button type="submit" isLoading={isSubmitting || updateAsset.isPending} disabled={!isDirty}>
            Save changes
          </Button>
        </form>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-ink">Checkout history</h2>
          {checkouts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableHead>Status</TableHead>
                <TableHead>Requested by</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Date</TableHead>
              </TableHeader>
              <TableBody>
                {checkouts.map((checkout) => (
                  <TableRow key={checkout.id}>
                    <TableCell>
                      <StatusPill label={checkout.status} tone={getAssetCheckoutStatusTone(checkout.status)} />
                    </TableCell>
                    <TableCell>{checkout.requested_by?.name || '—'}</TableCell>
                    <TableCell>{checkout.program?.title || '—'}</TableCell>
                    <TableCell>
                      {checkout.created_at
                        ? new Date(checkout.created_at).toLocaleDateString()
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-ink-muted">No checkout requests for this asset.</p>
          )}
        </div>
      </div>
    </div>
  )
}
