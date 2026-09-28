import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api, getErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { hasPermission } from '../../lib/permissions'
import { queryClient } from '../../lib/query'
import { unwrapList } from '../../lib/unwrap'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/ui/Toast'
import type { Announcement } from '../../types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Message is required'),
  audience: z.enum(['all', 'staff', 'members']),
  expires_at: z.string().optional(),
  publish_now: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

const fetchAnnouncements = async (status: string): Promise<Announcement[]> => {
  const params: Record<string, string> = {}
  if (status) params.status = status
  const { data } = await api.get('/api/v1/announcements', { params })
  return unwrapList<Announcement>(data)
}

const formatWhen = (value?: string | null) => {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const AnnouncementsPage = () => {
  const { user } = useAuth()
  const { showToast } = useToast()
  const canManage = hasPermission(user?.permissions, ['announcements.create', 'announcements.edit'])
  const [statusFilter, setStatusFilter] = useState(canManage ? '' : 'published')
  const [isOpen, setIsOpen] = useState(false)

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', statusFilter],
    queryFn: () => fetchAnnouncements(statusFilter),
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
      audience: 'all',
      publish_now: true,
    },
  })

  const createMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data } = await api.post('/api/v1/announcements', {
        ...values,
        expires_at: values.expires_at || null,
        status: values.publish_now ? 'published' : 'draft',
      })
      return data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      showToast('Announcement created', 'success')
      setIsOpen(false)
      reset({ audience: 'all', publish_now: true, title: '', body: '', expires_at: '' })
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  })

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/api/v1/announcements/${id}/publish`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      showToast('Announcement published', 'success')
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  })

  const handleCreate = (values: FormValues) => {
    createMutation.mutate(values)
  }

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="In-app broadcasts for the church family and staff"
        actions={
          canManage ? (
            <Button
              onClick={() => setIsOpen(true)}
              aria-label="Create announcement"
            >
              New announcement
            </Button>
          ) : undefined
        }
      />

      {canManage && (
        <div className="mb-4 max-w-xs">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All' },
              { value: 'draft', label: 'Draft' },
              { value: 'published', label: 'Published' },
              { value: 'archived', label: 'Archived' },
            ]}
          />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-ink-muted">Loading announcements…</p>
      ) : announcements.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          description="Publish a welcome note, service change, or volunteer briefing."
        />
      ) : (
        <ul className="space-y-3">
          {announcements.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border bg-surface px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-ink">{item.title}</h3>
                    <span className="rounded-full bg-accent-light px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-accent">
                      {item.audience}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-muted">
                    {item.body}
                  </p>
                  <p className="mt-3 text-xs text-ink-subtle">
                    {item.created_by?.name ? `${item.created_by.name} · ` : ''}
                    {item.status === 'published'
                      ? `Published ${formatWhen(item.published_at)}`
                      : `Created ${formatWhen(item.created_at)}`}
                  </p>
                </div>
                {canManage && item.status === 'draft' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => publishMutation.mutate(item.id)}
                    aria-label={`Publish ${item.title}`}
                  >
                    Publish
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="New announcement"
      >
        <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
          <Input
            label="Title"
            error={errors.title?.message}
            {...register('title')}
          />
          <Textarea
            label="Message"
            rows={5}
            error={errors.body?.message}
            {...register('body')}
          />
          <Select
            label="Audience"
            error={errors.audience?.message}
            {...register('audience')}
            options={[
              { value: 'all', label: 'Everyone' },
              { value: 'staff', label: 'Staff only' },
              { value: 'members', label: 'Members / portal' },
            ]}
          />
          <Input
            label="Expires (optional)"
            type="datetime-local"
            {...register('expires_at')}
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={!!watch('publish_now')}
              onChange={(e) => setValue('publish_now', e.target.checked)}
            />
            Publish immediately
          </label>
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
