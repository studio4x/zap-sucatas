const AUTH_ERROR_TRANSLATIONS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, 'E-mail ou senha inválidos.'],
  [/email not confirmed/i, 'E-mail ainda não confirmado. Verifique sua caixa de entrada.'],
  [/user already registered/i, 'Um usuário com este endereço de e-mail já foi cadastrado.'],
  [/password should be at least/i, 'A senha precisa ter pelo menos 6 caracteres.'],
  [/signup is disabled/i, 'O cadastro está temporariamente desativado.'],
  [/email rate limit exceeded/i, 'Muitas tentativas em sequência. Aguarde alguns minutos e tente novamente.'],
  [/invalid email/i, 'Informe um e-mail válido.'],
]

export function translateAuthErrorMessage(message: string) {
  const normalized = message.trim()

  for (const [pattern, translation] of AUTH_ERROR_TRANSLATIONS) {
    if (pattern.test(normalized)) {
      return translation
    }
  }

  return normalized
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return translateAuthErrorMessage(error.message)
  }

  return fallback
}
