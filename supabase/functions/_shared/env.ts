export function requireEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`)
  }

  return value
}


