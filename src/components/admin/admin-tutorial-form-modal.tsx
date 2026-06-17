import { useState } from 'react'
import ReactQuill from 'react-quill-new'
import { MinusCircle, Plus, X } from 'lucide-react'
import 'react-quill-new/dist/quill.snow.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { AdminTutorial, AdminTutorialDraft, AdminTutorialStep } from '@/domains/admin-tutorials/types'
import { cn } from '@/lib/utils'

type AdminTutorialFormModalProps = {
  initialTutorial?: AdminTutorial | null
  onClose: () => void
  onSave: (draft: AdminTutorialDraft) => void
}

type TutorialFormState = {
  category: string
  estimatedMinutes: string
  notesText: string
  steps: AdminTutorialStep[]
  summary: string
  title: string
}

function createEmptyStep() {
  return {
    title: '',
    description: '<p></p>',
  }
}

function createInitialFormState(tutorial?: AdminTutorial | null): TutorialFormState {
  if (!tutorial) {
    return {
      title: '',
      summary: '',
      category: 'Geral',
      estimatedMinutes: '3',
      notesText: '',
      steps: [createEmptyStep()],
    }
  }

  return {
    title: tutorial.title,
    summary: tutorial.summary,
    category: tutorial.category || 'Geral',
    estimatedMinutes: String(tutorial.estimatedMinutes || 3),
    notesText: tutorial.notes.join('\n'),
    steps: tutorial.steps.length > 0 ? tutorial.steps : [createEmptyStep()],
  }
}

export function AdminTutorialFormModal({
  initialTutorial,
  onClose,
  onSave,
}: AdminTutorialFormModalProps) {
  const [formState, setFormState] = useState<TutorialFormState>(() => createInitialFormState(initialTutorial))
  const [validationMessage, setValidationMessage] = useState('')

  const isEditing = Boolean(initialTutorial)
  const notesCount = formState.notesText.split('\n').map((line) => line.trim()).filter((line) => line.length > 0).length

  function updateStep(index: number, patch: Partial<AdminTutorialStep>) {
    setFormState((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) => (stepIndex === index ? { ...step, ...patch } : step)),
    }))
  }

  function removeStep(index: number) {
    setFormState((current) => {
      const nextSteps = current.steps.filter((_, stepIndex) => stepIndex !== index)
      return {
        ...current,
        steps: nextSteps.length > 0 ? nextSteps : [createEmptyStep()],
      }
    })
  }

  function handleSubmit() {
    const normalizedTitle = formState.title.trim()
    const normalizedSummary = formState.summary.trim()

    if (!normalizedTitle || !normalizedSummary) {
      setValidationMessage('Preencha título e resumo para salvar o tutorial.')
      return
    }

    onSave({
      id: initialTutorial?.id,
      title: normalizedTitle,
      summary: normalizedSummary,
      category: formState.category.trim() || 'Geral',
      estimatedMinutes: Number(formState.estimatedMinutes),
      steps: formState.steps,
      notes: formState.notesText
        .split('\n')
        .map((note) => note.trim())
        .filter((note) => note.length > 0),
    })
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-4">
      <button aria-label="Fechar modal de tutorial" className="absolute inset-0 bg-slate-950/50" onClick={onClose} type="button" />

      <div className="relative z-10 flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_40px_120px_-42px_rgba(15,23,42,0.58)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#154d7c_48%,#0d9488_100%)] px-6 py-6 text-white">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
              {isEditing ? 'Editar tutorial' : 'Novo tutorial'}
            </p>
            <h2 className="font-display text-2xl leading-tight">{isEditing ? 'Atualize o guia do admin' : 'Crie um novo guia operacional'}</h2>
            <p className="max-w-3xl text-sm leading-7 text-white/78">
              Trabalhe título, resumo, categoria, tempo, passos ricos e dicas rápidas no mesmo fluxo.
            </p>
          </div>

          <Button className="border-white/20 bg-white/10 !text-white hover:bg-white/16" onClick={onClose} size="icon" type="button" variant="outline">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {validationMessage ? (
              <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {validationMessage}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-900" htmlFor="tutorial-title">
                  Título
                </label>
                <Input
                  id="tutorial-title"
                  onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Ex.: Como revisar anúncios com segurança"
                  value={formState.title}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-900" htmlFor="tutorial-summary">
                  Resumo
                </label>
                <Textarea
                  className="min-h-28"
                  id="tutorial-summary"
                  onChange={(event) => setFormState((current) => ({ ...current, summary: event.target.value }))}
                  placeholder="Explique rapidamente o que este tutorial resolve."
                  value={formState.summary}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900" htmlFor="tutorial-category">
                  Categoria
                </label>
                <Input
                  id="tutorial-category"
                  onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
                  placeholder="Geral"
                  value={formState.category}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900" htmlFor="tutorial-estimated-minutes">
                  Tempo
                </label>
                <Select
                  id="tutorial-estimated-minutes"
                  onChange={(event) => setFormState((current) => ({ ...current, estimatedMinutes: event.target.value }))}
                  value={formState.estimatedMinutes}
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minuto{minutes > 1 ? 's' : ''}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <section className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50/85 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Passos</p>
                  <p className="text-sm leading-6 text-slate-600">Cada passo aceita título e descrição rica com links, listas e formatação simples.</p>
                </div>
                <Button
                  onClick={() => setFormState((current) => ({ ...current, steps: [...current.steps, createEmptyStep()] }))}
                  type="button"
                  variant="outline"
                >
                  <Plus className="size-4" />
                  Adicionar passo
                </Button>
              </div>

              <div className="mt-5 space-y-5">
                {formState.steps.map((step, index) => (
                  <article className="rounded-[1.5rem] border border-white/90 bg-white p-4 shadow-[0_20px_40px_-36px_rgba(15,23,42,0.75)]" key={`tutorial-step-${index}`}>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-3">
                        <span className="inline-flex size-9 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                          {index + 1}
                        </span>
                        <p className="text-sm font-semibold text-slate-950">Passo {index + 1}</p>
                      </div>

                      <Button
                        className={cn(formState.steps.length === 1 ? 'opacity-60' : '')}
                        onClick={() => removeStep(index)}
                        type="button"
                        variant="ghost"
                      >
                        <MinusCircle className="size-4" />
                        Remover
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900" htmlFor={`tutorial-step-title-${index}`}>
                          Título do passo
                        </label>
                        <Input
                          id={`tutorial-step-title-${index}`}
                          onChange={(event) => updateStep(index, { title: event.target.value })}
                          placeholder={`Ex.: Passo ${index + 1}`}
                          value={step.title}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900" htmlFor={`tutorial-step-description-${index}`}>
                          Descrição rica
                        </label>
                        <div className="tutorial-editor rounded-[1.25rem] border border-slate-200/80 bg-white">
                          <ReactQuill
                            id={`tutorial-step-description-${index}`}
                            modules={{
                              toolbar: [
                                ['bold', 'italic', 'underline'],
                                [{ list: 'ordered' }, { list: 'bullet' }],
                                ['link'],
                                ['clean'],
                              ],
                            }}
                            onChange={(value) => updateStep(index, { description: value })}
                            theme="snow"
                            value={step.description}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50/80 p-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-emerald-950" htmlFor="tutorial-notes">
                    Dicas rápidas
                  </label>
                  <span className="text-xs font-medium text-emerald-800">{notesCount} dica{notesCount === 1 ? '' : 's'} válida{notesCount === 1 ? '' : 's'}</span>
                </div>
                <Textarea
                  className="min-h-36 bg-white"
                  id="tutorial-notes"
                  onChange={(event) => setFormState((current) => ({ ...current, notesText: event.target.value }))}
                  placeholder={'Uma dica por linha.\nLinhas vazias serão descartadas.'}
                  value={formState.notesText}
                />
              </div>
            </section>
          </div>
        </div>

        <div className="border-t border-slate-200/80 bg-white px-6 py-4">
          <div className="flex flex-wrap justify-end gap-3">
            <Button onClick={onClose} type="button" variant="outline">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} type="button">
              {isEditing ? 'Salvar alterações' : 'Salvar tutorial'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
