import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { updatePassword } from '@/domains/auth/api'
import { getAuthErrorMessage } from '@/domains/auth/error-messages'
import { useAuth } from '@/hooks/use-auth'

export function AppProfilePage() {
  const { user } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const changePasswordMutation = useMutation({
    mutationFn: async (password: string) => updatePassword(password),
    onError: (error) => {
      setFeedback(getAuthErrorMessage(error, 'Falha ao atualizar a senha.'))
    },
    onSuccess: () => {
      setFeedback('Senha atualizada com sucesso.')
      setNewPassword('')
      setConfirmPassword('')
    },
  })

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

    if (newPassword.trim().length < 6) {
      setFeedback('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    if (newPassword !== confirmPassword) {
      setFeedback('A confirmação da senha não confere.')
      return
    }

    changePasswordMutation.mutate(newPassword)
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden rounded-[2rem] border-border/80 bg-white shadow-sm">
        <CardHeader className="space-y-3 border-b border-border/60 bg-gradient-to-r from-primary/5 via-white to-white px-6 py-6">
          <Badge className="w-fit border-primary/15 bg-primary/5 text-primary" variant="outline">
            Perfil
          </Badge>
          <div className="space-y-2">
            <CardTitle className="text-3xl tracking-tight">Minha conta</CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7">
              Visualize seus dados de acesso e altere a senha da conta sem sair da plataforma.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-border/70 bg-muted/25 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Dados da conta
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Nome
                  </p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {user?.fullName ?? 'Usuário autenticado'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    E-mail
                  </p>
                  <p className="mt-1 text-sm text-foreground">{user?.email ?? 'Sem e-mail'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Papel
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Status
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {user?.status === 'active'
                        ? 'Ativo'
                        : user?.status === 'under_review'
                          ? 'Em análise'
                          : user?.status === 'suspended'
                            ? 'Suspenso'
                            : 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="rounded-[1.5rem] border-border/70 shadow-sm">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Alterar senha</CardTitle>
              <CardDescription className="leading-7">
                Use uma senha forte e atualize o acesso sem precisar recriar a conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="profile-password-new">
                    Nova senha
                  </label>
                  <Input
                    autoComplete="new-password"
                    id="profile-password-new"
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Digite a nova senha"
                    type="password"
                    value={newPassword}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="profile-password-confirm">
                    Confirmar nova senha
                  </label>
                  <Input
                    autoComplete="new-password"
                    id="profile-password-confirm"
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repita a nova senha"
                    type="password"
                    value={confirmPassword}
                  />
                </div>

                <p className="text-xs leading-6 text-muted-foreground">
                  A senha precisa ter pelo menos 6 caracteres. Após a alteração, use a nova senha no próximo login.
                </p>

                {feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}

                <div className="flex flex-wrap gap-3">
                  <Button disabled={changePasswordMutation.isPending} type="submit">
                    {changePasswordMutation.isPending ? 'Atualizando...' : 'Atualizar senha'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
