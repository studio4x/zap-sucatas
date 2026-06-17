import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpDown, BookOpen, Eye, GripVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminTutorialContent } from '@/components/admin/admin-tutorial-content'
import { AdminTutorialFormModal } from '@/components/admin/admin-tutorial-form-modal'
import { OperationFeedback } from '@/components/shared/operation-feedback'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { AdminTutorial } from '@/domains/admin-tutorials/types'
import { useAdminTutorials } from '@/domains/admin-tutorials/use-admin-tutorials'
import { useOperationFeedback } from '@/hooks/use-operation-feedback'
import { cn } from '@/lib/utils'

type ModalState = {
  tutorial: AdminTutorial | null
  open: boolean
}

export function AdminTutorialsPage() {
  const {
    activeTutorial,
    activeTutorialId,
    deleteTutorial,
    openTutorial,
    reorderTutorials,
    saveTutorialDraft,
    syncTutorialSelection,
    tutorials,
  } = useAdminTutorials()
  const { clearFeedback, feedback, setSuccessFeedback } = useOperationFeedback()
  const previewRef = useRef<HTMLElement | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [modalState, setModalState] = useState<ModalState>({ open: false, tutorial: null })
  const [draggedTutorialId, setDraggedTutorialId] = useState<string | null>(null)
  const [dragOverTutorialId, setDragOverTutorialId] = useState<string | null>(null)

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timeout = window.setTimeout(() => {
      clearFeedback()
    }, 4000)

    return () => window.clearTimeout(timeout)
  }, [clearFeedback, feedback])

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const categories = useMemo(() => {
    return [...new Set(tutorials.map((tutorial) => tutorial.category.trim()).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right, 'pt-BR'))
  }, [tutorials])
  const filteredTutorials = useMemo(() => {
    return tutorials.filter((tutorial) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        tutorial.title.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
        tutorial.summary.toLocaleLowerCase('pt-BR').includes(normalizedSearch) ||
        tutorial.category.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
      const matchesCategory = categoryFilter === 'all' || tutorial.category === categoryFilter

      return matchesSearch && matchesCategory
    })
  }, [categoryFilter, normalizedSearch, tutorials])

  const hasFilters = normalizedSearch.length > 0 || categoryFilter !== 'all'
  const canReorder = !hasFilters

  function openCreateModal() {
    clearFeedback()
    setModalState({ open: true, tutorial: null })
  }

  function openEditModal(tutorial: AdminTutorial) {
    clearFeedback()
    setModalState({ open: true, tutorial })
  }

  function handleOpenOnPage(tutorialId: string) {
    syncTutorialSelection(tutorialId)
    previewRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function handleDelete(tutorial: AdminTutorial) {
    const confirmed = window.confirm(`Excluir o tutorial "${tutorial.title}"? Essa ação remove o conteúdo salvo localmente.`)
    if (!confirmed) {
      return
    }

    deleteTutorial(tutorial.id)
    setSuccessFeedback(`Tutorial "${tutorial.title}" excluído com sucesso.`)
  }

  function handleDrop(targetTutorialId: string) {
    if (!canReorder || !draggedTutorialId || draggedTutorialId === targetTutorialId) {
      setDragOverTutorialId(null)
      setDraggedTutorialId(null)
      return
    }

    const sourceIndex = tutorials.findIndex((tutorial) => tutorial.id === draggedTutorialId)
    const targetIndex = tutorials.findIndex((tutorial) => tutorial.id === targetTutorialId)

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      setDragOverTutorialId(null)
      setDraggedTutorialId(null)
      return
    }

    const nextTutorials = [...tutorials]
    const [movedTutorial] = nextTutorials.splice(sourceIndex, 1)
    nextTutorials.splice(targetIndex, 0, movedTutorial)
    reorderTutorials(nextTutorials.map((tutorial) => tutorial.id))
    setDragOverTutorialId(null)
    setDraggedTutorialId(null)
  }

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden rounded-[2rem] border-0 bg-[linear-gradient(135deg,#0f172a_0%,#144b78_45%,#0d9488_100%)] text-white shadow-[0_38px_120px_-56px_rgba(15,23,42,0.9)]">
        <CardContent className="p-6 md:p-8 lg:p-10">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                Tutoriais do admin
              </span>
              <div className="space-y-3">
                <h1 className="font-display text-3xl leading-tight md:text-[3rem]">Guias rápidos para operar o painel sem perder contexto</h1>
                <p className="text-sm leading-7 text-white/78 md:text-[15px]">
                  Conteúdos rápidos para executar tarefas sem perder tempo. Crie, revise, ordene e abra o mesmo tutorial na página ou no widget global do admin.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="bg-white !text-slate-950 hover:bg-white/90" onClick={openCreateModal} type="button">
                <Plus className="size-4" />
                NOVO TUTORIAL
              </Button>
              <Button asChild className="border-white/20 bg-white/10 !text-white hover:bg-white/16" type="button" variant="outline">
                <Link to={paths.admin.root}>Voltar ao admin</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {feedback ? <OperationFeedback feedback={feedback} /> : null}

      <Card className="rounded-[2rem] border border-white/75 bg-white/90 shadow-[0_28px_70px_-52px_rgba(15,23,42,0.85)]">
        <CardContent className="space-y-6 p-6 md:p-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tutoriais cadastrados</p>
              <h2 className="font-display text-2xl text-slate-950">Coleção completa</h2>
              <p className="text-sm leading-7 text-slate-600">Busque por título, resumo ou categoria, filtre o acervo e reorganize manualmente quando a listagem estiver limpa.</p>
            </div>
            <div className="inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              {filteredTutorials.length} de {tutorials.length} tutoriais
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px_auto]">
            <label className="relative block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Buscar tutorial</span>
              <Search className="pointer-events-none absolute left-4 top-[3.3rem] size-4 text-slate-400" />
              <Input
                className="pl-11"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por título, resumo ou categoria"
                value={search}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Filtrar por categoria</span>
              <Select onChange={(event) => setCategoryFilter(event.target.value)} value={categoryFilter}>
                <option value="all">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
            </label>

            {hasFilters ? (
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    setSearch('')
                    setCategoryFilter('all')
                  }}
                  type="button"
                  variant="outline"
                >
                  Limpar filtros
                </Button>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 px-4 py-3">
            <div className="inline-flex items-center gap-2 text-sm text-slate-700">
              <ArrowUpDown className="size-4 text-slate-500" />
              {canReorder
                ? 'Arraste os cards para reorganizar a ordem dos tutoriais.'
                : 'A ordenação fica disponível somente sem busca e sem filtro de categoria.'}
            </div>
            <Button onClick={openCreateModal} type="button" variant="ghost">
              <Plus className="size-4" />
              Criar tutorial
            </Button>
          </div>

          {filteredTutorials.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-lg font-semibold text-slate-950">Nenhum tutorial encontrado</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">Ajuste a busca ou limpe os filtros para voltar à coleção completa.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTutorials.map((tutorial) => {
                const isSelected = activeTutorialId === tutorial.id
                const isDragged = draggedTutorialId === tutorial.id
                const isDropTarget = dragOverTutorialId === tutorial.id

                return (
                  <article
                    className={cn(
                      'rounded-[1.75rem] border border-white/80 bg-white p-5 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.65)] transition',
                      isSelected && 'ring-2 ring-sky-300',
                      canReorder && 'cursor-grab',
                      isDragged && 'scale-[1.01] bg-sky-50 shadow-[0_36px_80px_-46px_rgba(14,116,144,0.62)]',
                      isDropTarget && 'border-sky-300 bg-sky-50/70',
                    )}
                    draggable={canReorder}
                    key={tutorial.id}
                    onDragEnd={() => {
                      setDraggedTutorialId(null)
                      setDragOverTutorialId(null)
                    }}
                    onDragEnter={() => {
                      if (canReorder && draggedTutorialId && draggedTutorialId !== tutorial.id) {
                        setDragOverTutorialId(tutorial.id)
                      }
                    }}
                    onDragOver={(event) => {
                      if (canReorder) {
                        event.preventDefault()
                      }
                    }}
                    onDragStart={() => {
                      if (canReorder) {
                        setDraggedTutorialId(tutorial.id)
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      handleDrop(tutorial.id)
                    }}
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {canReorder ? (
                            <span
                              aria-label={`Mover tutorial ${tutorial.title}`}
                              className="inline-flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500"
                              role="img"
                            >
                              <GripVertical className="size-4" />
                            </span>
                          ) : null}
                          <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-800">
                            {tutorial.category}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            {tutorial.estimatedMinutes} min
                          </span>
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                            {tutorial.steps.length} passo{tutorial.steps.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-display text-2xl leading-tight text-slate-950">{tutorial.title}</h3>
                          <p className="max-w-3xl text-sm leading-7 text-slate-600">{tutorial.summary}</p>
                        </div>

                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                          Categoria: {tutorial.category}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:max-w-[340px] xl:justify-end">
                        <Button onClick={() => handleOpenOnPage(tutorial.id)} type="button" variant={isSelected ? 'default' : 'outline'}>
                          <Eye className="size-4" />
                          Na página
                        </Button>
                        <Button onClick={() => openTutorial(tutorial.id)} type="button" variant="outline">
                          <BookOpen className="size-4" />
                          Widget
                        </Button>
                        <Button onClick={() => openEditModal(tutorial)} type="button" variant="outline">
                          <Pencil className="size-4" />
                          Editar
                        </Button>
                        <Button onClick={() => handleDelete(tutorial)} type="button" variant="ghost">
                          <Trash2 className="size-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4" ref={previewRef}>
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Visualização na página</p>
          <h2 className="font-display text-2xl text-slate-950">Preview detalhado do tutorial selecionado</h2>
        </div>

        {activeTutorial ? (
          <AdminTutorialContent
            actions={
              <>
                <Button onClick={() => openTutorial(activeTutorial.id)} type="button" variant="outline">
                  Abrir no widget
                </Button>
                <Button onClick={() => openEditModal(activeTutorial)} type="button">
                  Editar tutorial
                </Button>
              </>
            }
            tutorial={activeTutorial}
          />
        ) : (
          <Card className="rounded-[2rem] border border-dashed border-slate-300 bg-white">
            <CardContent className="p-8 text-center">
              <p className="text-lg font-semibold text-slate-950">Nenhum tutorial selecionado</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">Escolha um item da lista para abrir a visualização interna do módulo.</p>
            </CardContent>
          </Card>
        )}
      </section>

      {modalState.open ? (
        <AdminTutorialFormModal
          initialTutorial={modalState.tutorial}
          key={modalState.tutorial?.id ?? 'new-admin-tutorial'}
          onClose={() => setModalState({ open: false, tutorial: null })}
          onSave={(draft) => {
            const savedTutorial = saveTutorialDraft(draft)
            setModalState({ open: false, tutorial: null })
            setSuccessFeedback(`Tutorial "${savedTutorial.title}" salvo com sucesso.`)
          }}
        />
      ) : null}
    </section>
  )
}
