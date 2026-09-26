import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { z } from 'zod'
import { getErrorMessage, useAuth } from '../lib/auth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export const LoginPage = () => {
  const { login, isAuthenticated, isLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  if (isLoading) {
    return (
      <div className="brand-glow-bg flex min-h-screen items-center justify-center">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleLogin = async (data: LoginForm) => {
    setError(null)
    try {
      await login(data.email, data.password)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  return (
    <div className="brand-glow-bg relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.45)_100%)]" />
      <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="hidden lg:block">
          <div className="mb-8 flex items-center gap-4">
            <img
              src="/halwot-logo.png"
              alt="Halwot Emmanuel United Church"
              className="h-20 w-20 rounded-full shadow-[0_0_40px_rgba(244,121,32,0.45)]"
            />
            <div>
              <p className="text-sm font-medium tracking-wide text-ink-muted">
                Halwot Emmanuel United Church
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-ink">
                Halwot <span className="text-accent">Ops</span>
              </h1>
            </div>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-ink-muted">
            The operational backbone for people, ministries, programs, and church resources —
            built for how Halwot actually works.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-ink-subtle">
            <span className="rounded-full border border-border bg-surface/60 px-3 py-1.5 backdrop-blur">
              Members & follow-up
            </span>
            <span className="rounded-full border border-border bg-surface/60 px-3 py-1.5 backdrop-blur">
              Ministries & serving
            </span>
            <span className="rounded-full border border-border bg-surface/60 px-3 py-1.5 backdrop-blur">
              Assets & expenses
            </span>
          </div>
        </div>

        <div className="panel mx-auto w-full max-w-md p-8 shadow-[0_0_80px_-20px_rgba(244,121,32,0.45)]">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <img
              src="/halwot-logo.png"
              alt=""
              className="mb-4 h-16 w-16 rounded-full lg:hidden"
            />
            <h2 className="text-2xl font-bold text-ink">
              Sign in to <span className="text-accent">HEC OS</span>
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              Internal church operations for Halwot Emmanuel
            </p>
          </div>
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            {error && (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="mt-2 w-full"
              size="lg"
              isLoading={isSubmitting}
            >
              Login
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
