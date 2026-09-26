import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api, getErrorMessage } from '../../lib/api'
import { queryClient } from '../../lib/query'
import { unwrapData } from '../../lib/unwrap'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import type { Organization } from '../../types'

const orgSchema = z.object({
  name: z.string().min(1, 'Church name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
})

type OrgForm = z.infer<typeof orgSchema>

const fetchOrganization = async (): Promise<Organization> => {
  const { data } = await api.get('/api/v1/organization')
  return unwrapData<Organization>(data)
}

export const ChurchProfilePage = () => {
  const { showToast } = useToast()

  const { data: org, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: fetchOrganization,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrgForm>({
    resolver: zodResolver(orgSchema),
  })

  useEffect(() => {
    if (org) {
      reset({
        name: org.name,
        email: org.email || '',
        phone: org.phone || '',
        address: org.address || '',
      })
    }
  }, [org, reset])

  const updateOrg = useMutation({
    mutationFn: async (formData: OrgForm) => {
      const payload = { ...formData, email: formData.email || null }
      const { data } = await api.patch('/api/v1/organization', payload)
      return unwrapData<Organization>(data)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organization'] })
      showToast('Church profile updated', 'success')
    },
    onError: (err) => {
      showToast(getErrorMessage(err), 'error')
    },
  })

  const handleSave = async (formData: OrgForm) => {
    await updateOrg.mutateAsync(formData)
  }

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading church profile…</p>
  }

  return (
    <div>
      <PageHeader
        title="Church profile"
        description="Organization details for Halwot Evangelical Church"
      />
      <form
        onSubmit={handleSubmit(handleSave)}
        className="max-w-2xl space-y-4 rounded-lg border border-border bg-surface p-6"
      >
        <Input label="Church name" error={errors.name?.message} {...register('name')} />
        {org?.slug && (
          <p className="text-sm text-ink-muted">Slug: {org.slug}</p>
        )}
        <Textarea label="Address" rows={2} {...register('address')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Phone" type="tel" {...register('phone')} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        </div>
        <Button type="submit" isLoading={isSubmitting || updateOrg.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
    </div>
  )
}
