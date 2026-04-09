import { useState } from 'react'

export type OperationFeedbackTone = 'error' | 'info' | 'success' | 'warning'

export type OperationFeedbackState = {
  message: string
  tone: OperationFeedbackTone
}

function normalizeErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallback
}

export function useOperationFeedback() {
  const [feedback, setFeedback] = useState<OperationFeedbackState | null>(null)

  return {
    feedback,
    clearFeedback() {
      setFeedback(null)
    },
    setErrorFeedback(error: unknown, fallback: string) {
      setFeedback({
        message: normalizeErrorMessage(error, fallback),
        tone: 'error',
      })
    },
    setInfoFeedback(message: string) {
      setFeedback({
        message,
        tone: 'info',
      })
    },
    setSuccessFeedback(message: string) {
      setFeedback({
        message,
        tone: 'success',
      })
    },
    setWarningFeedback(message: string) {
      setFeedback({
        message,
        tone: 'warning',
      })
    },
  }
}
