import { Card, CardContent } from '@/components/ui/card'

export function RouteLoadingScreen() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-6">
      <Card className="rounded-[2rem] border-border/80">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Carregando pagina...
        </CardContent>
      </Card>
    </div>
  )
}
