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
import { getAssetStatusTone, StatusPill } from '../../components/ui/StatusPill'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table'
import { useToast } from '../../components/ui/Toast'
import type { Asset, AssetLocation, Ministry } from '../../types'

const assetSchema = z.object({
  code: z.string().min(1, 'Asset code is required'),
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['camera', 'microphone', 'speaker', 'projector', 'laptop', 'furniture', 'instrument', 'vehicle', 'other']),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  location_id: z.string().optional(),
  custodian_ministry_id: z.string().optional(),
})

type AssetForm = z.infer<typeof assetSchema>

const statusFilterOptions = [
  { value: '', label: 'All statuses' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'checked_out', label: 'Checked out' },
  { value: 'in_use', label: 'In use' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'retired', label: 'Retired' },
]

const categoryFilterOptions = [
  { value: '', label: 'All categories' },
  { value: 'camera', label: 'Camera' },
  { value: 'microphone', label: 'Microphone' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'projector', label: 'Projector' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'instrument', label: 'Instrument' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'other', label: 'Other' },
]

const categoryOptions = categoryFilterOptions.filter((o) => o.value !== '')

const conditionOptions = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

const fetchAssets = async (status: string, category: string): Promise<Asset[]> => {
  const params: Record<string, string> = {}
  if (status) params.status = status
  if (category) params.category = category
  const { data } = await api.get('/api/v1/assets', { params })
  return unwrapList<Asset>(data)
}

const fetchLocations = async (): Promise<AssetLocation[]> => {
  const { data } = await api.get('/api/v1/asset-locations')
  return unwrapList<AssetLocation>(data)
}

const fetchMinistries = async (): Promise<Ministry[]> => {
  const { data } = await api.get('/api/v1/ministries')
  return unwrapList<Ministry>(data)
}

export const AssetsPage = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets', statusFilter, categoryFilter],
    queryFn: () => fetchAssets(statusFilter, categoryFilter),
  })

  const { data: locations = [] } = useQuery({
    queryKey: ['asset-locations'],
    queryFn: fetchLocations,
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
  } = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
    defaultValues: { condition: 'good', category: 'other' },
  })

  const createAsset = useMutation({
    mutationFn: async (formData: AssetForm) => {
      const payload = {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        condition: formData.condition || 'good',
        location_id: formData.location_id ? Number(formData.location_id) : undefined,
        custodian_ministry_id: formData.custodian_ministry_id ? Number(formData.custodian_ministry_id) : undefined,
      }
      const { data } = await api.post('/api/v1/assets', payload)
      return unwrapData<Asset>(data)
    },
    onSuccess: (asset) => {
      void queryClient.invalidateQueries({ queryKey: ['assets'] })
      showToast('Asset created', 'success')
      setIsModalOpen(false)
      reset()
      navigate(`/operations/assets/${asset.id}`)
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const locationOptions = [
    { value: '', label: 'No location' },
    ...locations.map((l) => ({ value: String(l.id), label: l.name })),
  ]

  const ministryOptions = [
    { value: '', label: 'No custodian ministry' },
    ...ministries.map((m) => ({ value: String(m.id), label: m.name })),
  ]

  const handleRowClick = (id: number) => {
    navigate(`/operations/assets/${id}`)
  }

  return (
    <div>
      <PageHeader
        title="Assets"
        description="Track equipment and physical resources"
        actions={<Button onClick={() => setIsModalOpen(true)}>New asset</Button>}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:w-48">
          <Select
            options={statusFilterOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={categoryFilterOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
          />
        </div>
      </div>
      {isLoading && <p className="text-sm text-ink-muted">Loading assets…</p>}
      {!isLoading && assets.length === 0 && (
        <EmptyState
          title="No assets yet"
          description="Register equipment to track checkouts and condition."
          action={<Button onClick={() => setIsModalOpen(true)}>New asset</Button>}
        />
      )}
      {!isLoading && assets.length > 0 && (
        <Table>
          <TableHeader>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Location</TableHead>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id} onClick={() => handleRowClick(asset.id)}>
                <TableCell className="font-medium">{asset.code}</TableCell>
                <TableCell>{asset.name}</TableCell>
                <TableCell className="capitalize">{asset.category.replace(/_/g, ' ')}</TableCell>
                <TableCell>
                  <StatusPill label={asset.status} tone={getAssetStatusTone(asset.status)} />
                </TableCell>
                <TableCell className="capitalize">{asset.condition}</TableCell>
                <TableCell>{asset.location?.name || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="New asset"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit((d) => createAsset.mutateAsync(d))} isLoading={isSubmitting || createAsset.isPending}>
              Create
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit((d) => createAsset.mutateAsync(d))}>
          <Input label="Code" error={errors.code?.message} {...register('code')} />
          <Input label="Name" error={errors.name?.message} {...register('name')} />
          <Select label="Category" options={categoryOptions} error={errors.category?.message} {...register('category')} />
          <Select label="Condition" options={conditionOptions} {...register('condition')} />
          <Select label="Location" options={locationOptions} {...register('location_id')} />
          <Select label="Custodian ministry" options={ministryOptions} {...register('custodian_ministry_id')} />
        </form>
      </Modal>
    </div>
  )
}
