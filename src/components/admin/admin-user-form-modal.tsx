import type { AdminCreateUserValues, AdminUpdateUserValues } from '@/domains/profiles/schemas'
import { AdminUserForm } from './admin-user-form'

type AdminUserFormModalBaseProps = {
  isPending?: boolean
  onOpenChange: (open: boolean) => void
  open: boolean
}

type AdminUserFormModalProps =
  | (AdminUserFormModalBaseProps & {
      defaultValues: AdminCreateUserValues
      mode: 'create'
      onSubmit: (values: AdminCreateUserValues) => void
      submitDisabled?: boolean
      submitLabel: string
    })
  | (AdminUserFormModalBaseProps & {
      defaultValues: AdminUpdateUserValues
      mode: 'edit'
      onSubmit: (values: AdminUpdateUserValues) => void
      submitDisabled?: boolean
      submitLabel: string
    })

export function AdminUserFormModal(props: AdminUserFormModalProps) {
  if (!props.open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4 py-8">
      <button
        aria-label="Fechar modal de usuário"
        className="absolute inset-0 bg-slate-950/45"
        onClick={() => {
          if (!props.isPending) {
            props.onOpenChange(false)
          }
        }}
        type="button"
      />
      <div className="relative z-[1] w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-2xl">
        <div className="flex justify-end border-b border-border/60 px-4 py-3">
          <button
            className="inline-flex h-9 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            disabled={props.isPending}
            onClick={() => props.onOpenChange(false)}
            type="button"
          >
            Fechar
          </button>
        </div>
        <div className="max-h-[calc(100vh-6rem)] overflow-y-auto p-2 sm:p-4">
          {props.mode === 'create' ? (
            <AdminUserForm
              defaultValues={props.defaultValues}
              isPending={props.isPending}
              mode="create"
              onSubmit={props.onSubmit}
              submitDisabled={props.submitDisabled}
              submitLabel={props.submitLabel}
            />
          ) : (
            <AdminUserForm
              defaultValues={props.defaultValues}
              isPending={props.isPending}
              mode="edit"
              onCancel={() => props.onOpenChange(false)}
              onSubmit={props.onSubmit}
              submitDisabled={props.submitDisabled}
              submitLabel={props.submitLabel}
            />
          )}
        </div>
      </div>
    </div>
  )
}
