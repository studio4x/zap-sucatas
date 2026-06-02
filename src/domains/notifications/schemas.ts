import { z } from 'zod'

export const notificationBroadcastSchema = z.object({
  actionUrl: z.string().trim().max(300).optional().or(z.literal('')),
  body: z.string().trim().min(3, 'Informe a mensagem.').max(3000, 'A mensagem deve ter no máximo 3000 caracteres.'),
  category: z.string().trim().min(2, 'Informe a categoria.').max(80, 'A categoria deve ter no máximo 80 caracteres.'),
  channels: z.array(z.enum(['email', 'in-app', 'push', 'whatsapp'])).min(1, 'Selecione ao menos um canal.'),
  priority: z.enum(['high', 'low', 'normal', 'urgent']),
  target: z.enum(['all', 'users']),
  title: z.string().trim().min(3, 'Informe o título.').max(200, 'O título deve ter no máximo 200 caracteres.'),
  userIds: z.string().trim().optional().or(z.literal('')),
})

export const notificationPreferencesSchema = z.object({
  emailDigest: z.enum(['daily', 'immediate', 'never', 'weekly']),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietHoursEnd: z.string().trim().optional().or(z.literal('')),
  quietHoursStart: z.string().trim().optional().or(z.literal('')),
  quietHoursTimezone: z.string().trim().min(3),
  whatsappEnabled: z.boolean(),
})

export type NotificationBroadcastValues = z.infer<typeof notificationBroadcastSchema>
export type NotificationPreferencesValues = z.infer<typeof notificationPreferencesSchema>