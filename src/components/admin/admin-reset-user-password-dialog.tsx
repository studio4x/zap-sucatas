import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import {
  adminResetUserPasswordSchema,
  type AdminResetUserPasswordValues,
} from '@/domains/profiles/schemas'

type AdminResetUserPasswordDialogProps = {
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: AdminResetUserPasswordValues) => void
  open: boolean
  userLabel: string
}

export function AdminResetUserPasswordDialog({
  isPending = false,
  onOpenChange,
  onSubmit,
  open,
  userLabel,
}: AdminResetUserPasswordDialogProps) {
  const form = useForm<AdminResetUserPasswordValues>({
    defaultValues: {
      confirmPassword: '',
      password: '',
    },
    resolver: zodResolver(adminResetUserPasswordSchema),
  })

  useEffect(() => {
    if (!open) {
      form.reset({
        confirmPassword: '',
        password: '',
      })
    }
  }, [form, open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4">
      <button
        aria-label="Fechar redefinição de senha"
        className="absolute inset-0 bg-slate-950/45"
        onClick={() => {
          if (!isPending) {
            onOpenChange(false)
          }
        }}
        type="button"
      />
      <div className="relative w-full max-w-md rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
        <p className="text-sm font-semibold text-foreground">Redefinir senha</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Defina uma nova senha temporária para <span className="font-medium text-foreground">{userLabel}</span>.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={form.handleSubmit((values) => onSubmit(values))}
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-password">
              Nova senha temporária
            </label>
            <Input
              autoComplete="new-password"
              id="reset-password"
              type="password"
              {...form.register('password')}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="reset-confirm-password">
              Confirmar nova senha
            </label>
            <Input
              autoComplete="new-password"
              id="reset-confirm-password"
              type="password"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword ? (
              <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-3">
            <button
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-destructive px-4 text-sm font-medium text-destructive-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
