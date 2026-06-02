import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { MessageCircle } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import heroIndustrialBg from '@/assets/home-bg/hero-industrial-bg.png'
import { OperationFeedback } from '@/components/shared/operation-feedback'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { submitContactMessage } from '@/domains/contact/api'
import { contactMessageSchema, type ContactMessageValues } from '@/domains/contact/schemas'
import { useAuth } from '@/hooks/use-auth'
import { useOperationFeedback } from '@/hooks/use-operation-feedback'

export function ContactPage() {
  const { user } = useAuth()
  const { clearFeedback, feedback, setErrorFeedback, setSuccessFeedback } = useOperationFeedback()
  const form = useForm<ContactMessageValues>({
    defaultValues: {
      companyWebsite: '',
      email: user?.email ?? '',
      fullName: user?.fullName ?? '',
      message: '',
      phone: '',
      subject: 'Contato via site',
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
      subject: 'Contato via site',
    })
  }, [form, user?.email, user?.fullName])

  const submitMutation = useMutation({
    mutationFn: submitContactMessage,
    onError: (error) => {
      setErrorFeedback(error, 'Não foi possível enviar a mensagem agora.')
    },
    onSuccess: () => {
      setSuccessFeedback('Mensagem enviada com sucesso. Nossa equipe vai retornar o contato em breve.')
      form.reset({
        companyWebsite: '',
        email: user?.email ?? '',
        fullName: user?.fullName ?? '',
        message: '',
        phone: '',
        subject: 'Contato via site',
      })
    },
  })

  const supportPhone = '(11) 97618-6992'
  const supportWhatsappUrl = 'https://wa.me/5511976186992'

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2 overflow-hidden">
        <img alt="Contato Zap Sucatas" className="h-[170px] w-full object-cover md:h-[190px]" src={heroIndustrialBg} />
        <div className="absolute inset-0 bg-black/58" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-5xl font-semibold tracking-tight text-white">Contato</h1>
        </div>
      </section>

      {feedback ? <OperationFeedback feedback={feedback} /> : null}

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div>
            <p className="text-4xl font-black leading-none tracking-tight">
              <span className="text-primary">ZAP</span>
              <span className="text-foreground">SUCATAS</span>
            </p>
            <h2 className="mt-2 text-4xl font-bold leading-tight tracking-tight text-foreground">Entre em contato conosco!</h2>
          </div>

          <p className="max-w-xl text-2xl leading-8 text-muted-foreground">
            Se desejar fazer alguma sugestão, reclamação, elogio ou denuncia utilize nosso formulário ou entre em contato em nosso WhatsApp.
          </p>

          <div className="inline-flex items-center gap-3 text-primary">
            <MessageCircle className="size-8" />
            <a
              className="text-4xl font-semibold hover:underline"
              href={supportWhatsappUrl}
              rel="noreferrer"
              target="_blank"
            >
              {supportPhone}
            </a>
          </div>

          <p className="max-w-xl text-xl leading-8 text-muted-foreground">
            Sua opiniao e muito importante para nos. Estamos a disposicao para sanar todas as suas duvidas ou solicitacoes.
          </p>

          <p className="text-3xl font-semibold text-foreground">Vamos conversar!</p>
        </div>

        <div>
          <h3 className="text-4xl font-semibold text-primary">Envie sua mensagem</h3>

          <form
            className="mt-6 space-y-3"
            onSubmit={form.handleSubmit((values) => {
              clearFeedback()
              submitMutation.mutate(values)
            })}
          >
            <input autoComplete="off" className="hidden" tabIndex={-1} type="text" {...form.register('companyWebsite')} />
            <input className="hidden" type="text" {...form.register('subject')} />

            <Input className="h-12 rounded-md" placeholder="Digite seu nome" {...form.register('fullName')} />
            {form.formState.errors.fullName ? <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p> : null}

            <Input className="h-12 rounded-md" placeholder="Digite seu email" type="email" {...form.register('email')} />
            {form.formState.errors.email ? <p className="text-sm text-destructive">{form.formState.errors.email.message}</p> : null}

            <Input className="h-12 rounded-md" placeholder="Seu telefone" {...form.register('phone')} />

            <Textarea className="min-h-36 rounded-md" placeholder="Sua mensagem" {...form.register('message')} />
            {form.formState.errors.message ? <p className="text-sm text-destructive">{form.formState.errors.message.message}</p> : null}

            <Button className="mt-2 h-12 w-full max-w-[420px] rounded-md bg-primary text-lg font-semibold text-white hover:bg-primary/90" disabled={submitMutation.isPending} type="submit">
              {submitMutation.isPending ? 'Enviando...' : 'Enviar'}
            </Button>
          </form>
        </div>
      </section>
    </div>
  )
}