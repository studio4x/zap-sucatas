import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Mail, Phone } from 'lucide-react'
import { PublicSectionHeading } from '@/components/public/public-section-heading'
import { OperationFeedback } from '@/components/shared/operation-feedback'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitContactMessage } from '@/domains/contact/api'
import { contactMessageSchema, type ContactMessageValues } from '@/domains/contact/schemas'
import { fetchSystemSettings } from '@/domains/settings/api'
import { useAuth } from '@/hooks/use-auth'
import { useOperationFeedback } from '@/hooks/use-operation-feedback'

export function ContactPage() {
  const { user } = useAuth()
  const { clearFeedback, feedback, setErrorFeedback, setSuccessFeedback } = useOperationFeedback()
  const settingsQuery = useQuery({
    queryKey: ['system-settings', 'public-contact'],
    queryFn: fetchSystemSettings,
  })
  const form = useForm<ContactMessageValues>({
    defaultValues: {
      companyWebsite: '',
      email: user?.email ?? '',
      fullName: user?.fullName ?? '',
      message: '',
      phone: '',
      subject: '',
    },
    resolver: zodResolver(contactMessageSchema),
  })

  useEffect(() => {
    form.reset({
      companyWebsite: '',
      email: user?.email ?? '',
      fullName: user?.fullName ?? '',
      message: '',
      phone: '',
      subject: '',
    })
  }, [form, user?.email, user?.fullName])

  const submitMutation = useMutation({
    mutationFn: submitContactMessage,
    onError: (error) => {
      setErrorFeedback(error, 'Nao foi possivel enviar a mensagem agora.')
    },
    onSuccess: () => {
      setSuccessFeedback('Mensagem enviada com sucesso. Nossa equipe vai retornar o contato em breve.')
      form.reset({
        companyWebsite: '',
        email: user?.email ?? '',
        fullName: user?.fullName ?? '',
        message: '',
        phone: '',
        subject: '',
      })
    },
  })

  const supportEmail = settingsQuery.data?.supportEmail ?? 'faleconosco@zapsucatas.com.br'
  const supportPhone = settingsQuery.data?.supportPhone ?? '(em atualizacao)'

  return (
    <div className="space-y-8 lg:space-y-10">
      <PublicSectionHeading
        description="Fale com a equipe da Zap Sucatas para duvidas comerciais, suporte de plataforma e orientacao sobre publicacao de anuncios."
        eyebrow="Contato"
        title="Canal direto com a operacao"
      />

      {feedback ? <OperationFeedback feedback={feedback} /> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="border-border/80">
          <CardContent className="space-y-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Mail className="size-5" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">E-mail comercial</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Use este canal para duvidas sobre anuncios, operacao do portal e oportunidades comerciais.
            </p>
            <a className="text-base font-semibold text-primary" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="space-y-4 p-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Phone className="size-5" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Telefone de suporte</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Contato rapido para encaminhamento comercial e orientacao sobre o uso da plataforma.
            </p>
            <a className="text-base font-semibold text-primary" href={`tel:${supportPhone}`}>
              {supportPhone}
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80">
        <CardContent className="space-y-4 p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-foreground">Como podemos ajudar?</h2>
          <p className="text-base leading-8 text-foreground/90">
            A Zap Sucatas esta estruturada para funcionar como portal comercial especializado. Se voce
            precisa de ajuda para anunciar, entender a moderacao, consultar precos ou entrar em contato
            com a operacao, este e o ponto de partida.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardContent className="space-y-6 p-6 md:p-8">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Enviar mensagem</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              Use o formulario para falar com a operacao comercial, tirar duvidas sobre anuncios ou solicitar apoio no uso da plataforma.
            </p>
          </div>

          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={form.handleSubmit((values) => {
              clearFeedback()
              submitMutation.mutate(values)
            })}
          >
            <input
              autoComplete="off"
              className="hidden"
              tabIndex={-1}
              type="text"
              {...form.register('companyWebsite')}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="contact-full-name">
                Nome completo
              </label>
              <Input id="contact-full-name" {...form.register('fullName')} />
              {form.formState.errors.fullName ? (
                <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="contact-email">
                E-mail
              </label>
              <Input id="contact-email" type="email" {...form.register('email')} />
              {form.formState.errors.email ? (
                <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="contact-phone">
                Telefone
              </label>
              <Input id="contact-phone" placeholder="(11) 99999-9999" {...form.register('phone')} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="contact-subject">
                Assunto
              </label>
              <Input id="contact-subject" {...form.register('subject')} />
              {form.formState.errors.subject ? (
                <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
              ) : null}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground" htmlFor="contact-message">
                Mensagem
              </label>
              <Textarea
                id="contact-message"
                placeholder="Descreva sua necessidade comercial ou operacional."
                {...form.register('message')}
              />
              {form.formState.errors.message ? (
                <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button disabled={submitMutation.isPending} type="submit">
                {submitMutation.isPending ? 'Enviando...' : 'Enviar mensagem'}
              </Button>
              <Button
                disabled={submitMutation.isPending}
                onClick={() => {
                  clearFeedback()
                  form.reset({
                    companyWebsite: '',
                    email: user?.email ?? '',
                    fullName: user?.fullName ?? '',
                    message: '',
                    phone: '',
                    subject: '',
                  })
                }}
                type="button"
                variant="outline"
              >
                Limpar formulario
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
