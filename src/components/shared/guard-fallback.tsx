import { LoaderCircle } from 'lucide-react'

type GuardFallbackProps = {
  title: string
}

export function GuardFallback({ title }: GuardFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[1.75rem] border border-border/70 bg-card/90 p-8 text-center shadow-lg">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LoaderCircle className="size-6 animate-spin" />
        </div>
        <h1 className="mt-5 font-display text-2xl text-foreground">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Guard placeholder em execução. Aqui entram sessão real, refresh token e validações de
          acesso.
        </p>
      </div>
    </div>
  )
}
