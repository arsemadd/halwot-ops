import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { api, getErrorMessage } from '../../lib/api'
import { queryClient } from '../../lib/query'
import { unwrapData } from '../../lib/unwrap'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { PageHeader } from '../../components/ui/PageHeader'
import { useToast } from '../../components/ui/Toast'
import type { PortalOverview } from '../../types'

const profileSchema = z.object({
  preferred_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

const fetchPortal = async (): Promise<PortalOverview> => {
  const { data } = await api.get('/api/v1/portal')
  return unwrapData<PortalOverview>(data)
}

const formatWhen = (value?: string | null) => {
  if (!value) return 'TBD'
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const PortalPage = () => {
  const { showToast } = useToast()

  const { data, isLoading, error } = useQuery({
    queryKey: ['portal'],
    queryFn: fetchPortal,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    if (!data?.person) return
    reset({
      preferred_name: data.person.preferred_name || '',
      phone: data.person.phone || '',
      email: data.person.email || '',
      address: data.person.address || '',
    })
  }, [data?.person, reset])

  const profileMutation = useMutation({
    mutationFn: async (values: ProfileForm) => {
      await api.patch('/api/v1/portal/profile', values)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['portal'] })
      showToast('Profile updated', 'success')
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  })

  const rsvpMutation = useMutation({
    mutationFn: async (payload: { program_id: number; status: string }) => {
      await api.post('/api/v1/portal/rsvps', payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['portal'] })
      showToast('RSVP saved', 'success')
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  })

  const assignmentMutation = useMutation({
    mutationFn: async (payload: { id: number; confirmation_status: string }) => {
      await api.patch(`/api/v1/portal/assignments/${payload.id}`, {
        confirmation_status: payload.confirmation_status,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['portal'] })
      showToast('Serving response saved', 'success')
    },
    onError: (err) => showToast(getErrorMessage(err), 'error'),
  })

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading your portal…</p>
  }

  if (error || !data) {
    return (
      <EmptyState
        title="Portal unavailable"
        description={
          getErrorMessage(error) ||
          'Link your login account to a member profile to use the portal.'
        }
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="My portal"
        description={`Welcome${data.person.preferred_name ? `, ${data.person.preferred_name}` : ''} — profile, schedule, and RSVPs`}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">My profile</h2>
          <p className="mt-1 text-xs text-ink-muted">
            Membership status:{' '}
            <span className="capitalize">{data.person.membership_status}</span>
          </p>
          <form
            onSubmit={handleSubmit((values) => profileMutation.mutate(values))}
            className="mt-4 space-y-3"
          >
            <Input label="Preferred name" {...register('preferred_name')} />
            <Input label="Phone" {...register('phone')} />
            <Input label="Email" error={errors.email?.message} {...register('email')} />
            <Input label="Address" {...register('address')} />
            <Button type="submit" isLoading={isSubmitting || profileMutation.isPending}>
              Save profile
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">My serving</h2>
          {data.serving.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No active ministry roles yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data.serving.map((item) => (
                <li key={item.id} className="rounded-xl bg-canvas px-3 py-2 text-sm">
                  <span className="font-medium text-ink">{item.ministry?.name}</span>
                  {item.role && <span className="text-ink-muted"> · {item.role}</span>}
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-6 text-sm font-semibold text-ink">Upcoming assignments</h3>
          {data.assignments.length === 0 ? (
            <p className="mt-2 text-sm text-ink-muted">No serving assignments coming up.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {data.assignments.map((assignment) => (
                <li key={assignment.id} className="rounded-xl border border-border px-3 py-3">
                  <p className="text-sm font-medium text-ink">{assignment.program?.title}</p>
                  <p className="text-xs text-ink-muted">
                    {assignment.role} · {formatWhen(assignment.program?.starts_at)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['confirmed', 'declined', 'pending'] as const).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={assignment.confirmation_status === status ? 'primary' : 'secondary'}
                        onClick={() =>
                          assignmentMutation.mutate({
                            id: assignment.id,
                            confirmation_status: status,
                          })
                        }
                        aria-label={`Mark serving ${status}`}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">Upcoming programs & RSVP</h2>
          {data.upcoming_programs.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No upcoming programs scheduled.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.upcoming_programs.map((program) => (
                <li
                  key={program.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{program.title}</p>
                    <p className="text-xs text-ink-muted">
                      {formatWhen(program.starts_at)}
                      {program.location ? ` · ${program.location}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['attending', 'maybe', 'not_attending'] as const).map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={program.rsvp_status === status ? 'primary' : 'secondary'}
                        onClick={() =>
                          rsvpMutation.mutate({ program_id: program.id, status })
                        }
                        aria-label={`RSVP ${status}`}
                      >
                        {status === 'not_attending' ? "can't make it" : status}
                      </Button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {data.announcements.length > 0 && (
          <section className="rounded-2xl border border-border bg-surface p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-ink">For you</h2>
            <ul className="mt-3 space-y-3">
              {data.announcements.map((item) => (
                <li key={item.id} className="rounded-xl bg-accent-light px-4 py-3">
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="mt-1 text-sm text-ink-muted">{item.body}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
