import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HelpCircle, LifeBuoy, Lock, Paperclip, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createSupportTicket, fetchSupportConfig, uploadSupportAttachment } from '@/domains/support/api'
import { supportTicketSchema, type SupportTicketSchemaValues } from '@/domains/support/schemas'
import type { SupportTicketPriority } from '@/domains/support/types'
import { useAuth } from '@/hooks/use-auth'
import { defaultSupportConfig, formatBusinessHours, getSupportCategoryMeta, supportPriorityOptions } from '@/lib/support-sla'

type SupportTicketModalProps = {
  initialStep?: 'choice' | 'form'
  onOpenChange: (open: boolean) => void
  open: boolean
}

export function SupportTicketModal({ initialStep = 'choice', onOpenChange, open }: SupportTicketModalProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [step, setStep] = useState<'choice' | 'form'>(initialStep)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const configQuery = useQuery({
    queryKey: ['support', 'config', 'modal'],
    queryFn: fetchSupportConfig,
    enabled: open,
  })

  const form = useForm<SupportTicketSchemaValues>({
    defaultValues: {
      category: 'general',
      description: '',
      priority: 'medium',
      subject: '',
    },
    resolver: zodResolver(supportTicketSchema),
  })

  const availablePriorities = useMemo<Array<{ label: string; value: SupportTicketPriority }>>(() => {
    if (user?.role === 'admin') {
      return supportPriorityOptions
    }

    return supportPriorityOptions.filter((option) => option.value !== 'urgent')
  }, [user?.role])

  const createMutation = useMutation({
    mutationFn: async (values: SupportTicketSchemaValues) => {
      if (!user?.profileId) {
        throw new Error('Faça login para abrir um chamado.')
      }

      let attachmentName: string | null = null
      let attachmentUrl: string | null = null

      if (selectedFile && user.id) {
        const uploaded = await uploadSupportAttachment({ authUserId: user.id, file: selectedFile })
        attachmentName = uploaded.attachmentName
        attachmentUrl = uploaded.attachmentUrl
      }

      return createSupportTicket({
        attachmentName,
        attachmentUrl,
        category: values.category,
        description: values.description,
        priority: values.priority,
        subject: values.subject,
        userId: user.profileId,
      })
    },
    onSuccess: async (ticket) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['support', 'admin'] }),
      ])
      form.reset()
      setSelectedFile(null)
      onOpenChange(false)
      navigate(paths.app.supportDetail(ticket.id))
    },
  })

  useEffect(() => {
    if (open) {
      setStep(initialStep)
    }
  }, [initialStep, open])

  if (!open) {
    return null
  }

  const config = configQuery.data ?? defaultSupportConfig
  const selectedCategory = getSupportCategoryMeta(config, form.watch('category'))

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4 py-6">
      <button aria-label="Fechar chamado" className="absolute inset-0 bg-slate-950/50" onClick={() => onOpenChange(false)} type="button" />
      <div className="relative w-full max-w-[560px] overflow-hidden rounded-[1.8rem] border border-border bg-card shadow-2xl">
        {step === 'choice' ? (
          <div className="space-y-6 p-6">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HelpCircle className="size-6" />
            </div>
            <div className="space-y-2 text-center">
              <h2 className="font-display text-3xl tracking-tight text-foreground">Como podemos ajudar?</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Consulte as perguntas frequentes ou abra um chamado para falar com a equipe.
              </p>
            </div>
            <div className="grid gap-3">
              <Link className="rounded-[1.4rem] border border-border bg-background px-5 py-4 text-left transition hover:bg-muted" onClick={() => onOpenChange(false)} to={paths.public.support}>
                <p className="font-semibold text-foreground">Ver perguntas frequentes</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Abra a central publica de suporte e SLA.</p>
              </Link>
              <button className="rounded-[1.4rem] border border-primary/20 bg-primary/5 px-5 py-4 text-left transition hover:bg-primary/10" onClick={() => setStep('form')} type="button">
                <p className="font-semibold text-foreground">Abrir um chamado</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Registrar um ticket com contexto e anexo opcional.</p>
              </button>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)} type="button" variant="outline">Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="max-h-[90vh] overflow-y-auto">
            <div className="border-b border-border bg-secondary/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                    <LifeBuoy className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Novo chamado</p>
                    <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Abrir ticket de suporte</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Registre contexto, urgencia e anexo opcional para acelerar a triagem.</p>
                  </div>
                </div>
                <button className="rounded-full border border-border p-2 text-muted-foreground transition hover:bg-background hover:text-foreground" onClick={() => onOpenChange(false)} type="button">
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-[1.4rem] border border-primary/10 bg-primary/5 p-4">
                <p className="text-sm font-semibold text-foreground">SLA da categoria selecionada</p>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{selectedCategory.description}</p>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Horario: {formatBusinessHours((config ?? configQuery.data)?.businessHours ?? { timezone: 'America/Sao_Paulo', daysOfWeek: [1,2,3,4,5], startHour: 8, endHour: 18 })}</p>
                <p className="mt-2 text-xs text-muted-foreground">A prioridade serve apenas para triagem interna. Nao altera a promessa publica de SLA.</p>
              </div>

              {!user?.profileId ? (
                <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Faça login para abrir um chamado e acompanhar o histórico.
                  <div className="mt-3">
                    <Button asChild type="button"><Link to={paths.auth.login}>Entrar</Link></Button>
                  </div>
                </div>
              ) : null}

              <form className="space-y-4" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="support-category">Categoria</label>
                  <Select id="support-category" value={form.watch('category')} {...form.register('category')}>
                    {config.categories.map((option) => (
                      <option key={option.key} value={option.key}>{option.label}</option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="support-subject">Assunto</label>
                  <Input id="support-subject" placeholder="Ex: problema com pagamento ou acesso" {...form.register('subject')} />
                  {form.formState.errors.subject ? <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="support-priority">Prioridade interna</label>
                  <Select id="support-priority" value={form.watch('priority')} {...form.register('priority')}>
                    {availablePriorities.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </Select>
                  {user?.role !== 'admin' ? (
                    <p className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Lock className="size-3.5" /> Prioridade usada apenas na triagem interna do backoffice.</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="support-description">Descricao</label>
                  <Textarea id="support-description" placeholder="Explique o contexto, os passos ja tentados e o que voce precisa destravar agora." {...form.register('description')} />
                  {form.formState.errors.description ? <p className="text-sm text-destructive">{form.formState.errors.description.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Anexo (opcional)</label>
                  <label className="flex cursor-pointer items-center justify-between rounded-[1.4rem] border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground transition hover:bg-muted">
                    <span className="inline-flex items-center gap-2"><Paperclip className="size-4" /> {selectedFile ? selectedFile.name : 'Selecionar arquivo'}</span>
                    <input className="hidden" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} type="file" />
                  </label>
                  {selectedFile ? (
                    <button className="text-xs font-medium text-primary hover:underline" onClick={() => setSelectedFile(null)} type="button">Remover anexo</button>
                  ) : null}
                </div>

                {createMutation.isError ? <p className="text-sm text-destructive">{createMutation.error instanceof Error ? createMutation.error.message : 'Nao foi possivel abrir o chamado.'}</p> : null}

                <div className="flex justify-between gap-3 pt-2">
                  <Button onClick={() => setStep(initialStep === 'form' ? 'form' : 'choice')} type="button" variant="outline">Voltar</Button>
                  <Button disabled={!user?.profileId || createMutation.isPending} type="submit">{createMutation.isPending ? 'Enviando...' : 'Enviar chamado'}</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
