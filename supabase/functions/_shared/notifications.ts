export const notificationChannels = ['push', 'email', 'whatsapp', 'in-app'] as const
export type NotificationChannel = (typeof notificationChannels)[number]

const RETRY_DELAYS_MINUTES = [5, 15, 60, 240] as const

export function normalizeChannels(input: unknown): NotificationChannel[] {
  if (!Array.isArray(input)) {
    return ['in-app']
  }

  const channels = input
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter((value): value is NotificationChannel =>
      notificationChannels.includes(value as NotificationChannel),
    )

  return channels.length > 0 ? Array.from(new Set(channels)) : ['in-app']
}

export function computeNextRetryAt(attemptCount: number) {
  const index = Math.max(0, Math.min(attemptCount - 1, RETRY_DELAYS_MINUTES.length - 1))
  const minutes = RETRY_DELAYS_MINUTES[index]
  return new Date(Date.now() + minutes * 60 * 1000).toISOString()
}

export function shouldRetry(attemptCount: number) {
  return attemptCount < 5
}

function getLocalMinutesFromMidnight(timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(new Date())
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0')

  return hour * 60 + minute
}

function parseTimeToMinutes(value: string | null | undefined) {
  if (!value || !/^\d{2}:\d{2}/.test(value)) {
    return null
  }

  const [hour, minute] = value.split(':').map((part) => Number(part))

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null
  }

  return hour * 60 + minute
}

export function isQuietHoursActive(input: {
  enabled: boolean
  end: string | null
  start: string | null
  timezone: string | null
}) {
  if (!input.enabled) {
    return false
  }

  const timezone = input.timezone?.trim() || 'America/Sao_Paulo'
  const start = parseTimeToMinutes(input.start)
  const end = parseTimeToMinutes(input.end)

  if (start === null || end === null || start === end) {
    return false
  }

  const now = getLocalMinutesFromMidnight(timezone)

  if (start < end) {
    return now >= start && now < end
  }

  return now >= start || now < end
}

