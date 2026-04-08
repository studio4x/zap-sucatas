import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  adminCreateUserSchema,
  adminUpdateUserSchema,
  type AdminCreateUserValues,
  type AdminUpdateUserValues,
} from '@/domains/profiles/schemas'

type AdminUserFormProps =
  | {
      defaultValues: AdminCreateUserValues
      isPending?: boolean
      mode: 'create'
      onSubmit: (values: AdminCreateUserValues) => void
      submitLabel: string
      submitDisabled?: boolean
    }
  | {
      defaultValues: AdminUpdateUserValues
      isPending?: boolean
      mode: 'edit'
      onCancel: () => void
      onSubmit: (values: AdminUpdateUserValues) => void
      submitLabel: string
      submitDisabled?: boolean
    }

export function AdminUserForm(props: AdminUserFormProps) {
  const form = useForm<AdminCreateUserValues | AdminUpdateUserValues>({
    defaultValues: props.defaultValues,
    resolver: zodResolver(props.mode === 'create' ? adminCreateUserSchema : adminUpdateUserSchema),
  })

  useEffect(() => {
    form.reset(props.defaultValues)
  }, [form, props.defaultValues])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.mode === 'create' ? 'Adicionar novo usuario' : 'Editar usuario selecionado'}</CardTitle>
        <CardDescription>
          {props.mode === 'create'
            ? 'Crie contas pelo painel com papel, status e senha inicial definidos pelo admin.'
            : 'Ajuste dados basicos, papel e status sem expor regra critica no frontend.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={form.handleSubmit((values) => props.onSubmit(values as never))}
        >
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor={`${props.mode}-full-name`}>
              Nome completo
            </label>
            <Input id={`${props.mode}-full-name`} {...form.register('fullName')} />
            {form.formState.errors.fullName ? (
              <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground" htmlFor={`${props.mode}-email`}>
              E-mail
            </label>
            <Input id={`${props.mode}-email`} type="email" {...form.register('email')} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor={`${props.mode}-phone`}>
              Telefone
            </label>
            <Input id={`${props.mode}-phone`} {...form.register('phone')} placeholder="(11) 99999-9999" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor={`${props.mode}-role`}>
              Papel
            </label>
            <Select id={`${props.mode}-role`} {...form.register('role')}>
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor={`${props.mode}-status`}>
              Status
            </label>
            <Select id={`${props.mode}-status`} {...form.register('status')}>
              <option value="active">Ativo</option>
              <option value="under_review">Em analise</option>
              <option value="suspended">Suspenso</option>
            </Select>
          </div>

          {props.mode === 'create' ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="create-password">
                  Senha inicial
                </label>
                <Input id="create-password" type="password" {...form.register('password')} />
                {'password' in form.formState.errors && form.formState.errors.password ? (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="create-confirm-password">
                  Confirmar senha
                </label>
                <Input id="create-confirm-password" type="password" {...form.register('confirmPassword')} />
                {'confirmPassword' in form.formState.errors && form.formState.errors.confirmPassword ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button disabled={props.isPending || props.submitDisabled} type="submit">
              {props.isPending ? 'Salvando...' : props.submitLabel}
            </Button>
            {props.mode === 'edit' ? (
              <Button disabled={props.isPending} onClick={props.onCancel} type="button" variant="outline">
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
