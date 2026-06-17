import { BookOpenText, ChevronUp, Minimize2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { AdminTutorialContent } from '@/components/admin/admin-tutorial-content'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { AdminTutorial } from '@/domains/admin-tutorials/types'
import { cn } from '@/lib/utils'

type AdminTutorialsFloatingPanelProps = {
  activeTutorial: AdminTutorial | null
  closeDrawer: () => void
  isDrawerMinimized: boolean
  isDrawerOpen: boolean
  minimizeDrawer: () => void
  openTutorial: (tutorialId?: string) => void
  restoreDrawer: () => void
  selectTutorial: (tutorialId: string) => void
  tutorials: AdminTutorial[]
}

export function AdminTutorialsFloatingPanel({
  activeTutorial,
  closeDrawer,
  isDrawerMinimized,
  isDrawerOpen,
  minimizeDrawer,
  openTutorial,
  restoreDrawer,
  selectTutorial,
  tutorials,
}: AdminTutorialsFloatingPanelProps) {
  if (!activeTutorial) {
    return null
  }

  if (isDrawerMinimized) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-end px-4">
        <button
          className="pointer-events-auto inline-flex max-w-[min(92vw,360px)] items-center gap-3 rounded-full border border-slate-200/80 bg-slate-950 px-5 py-3 text-left text-white shadow-2xl"
          onClick={restoreDrawer}
          type="button"
        >
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-white/12">
            <ChevronUp className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Ajuda rápida</span>
            <span className="block truncate text-sm font-medium">{activeTutorial.title}</span>
          </span>
        </button>
      </div>
    )
  }

  if (!isDrawerOpen) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex justify-end px-4">
        <button
          className="pointer-events-auto inline-flex max-w-[min(92vw,420px)] items-center gap-3 rounded-full border border-sky-200/80 bg-white px-5 py-3 text-left shadow-[0_30px_70px_-34px_rgba(15,23,42,0.6)]"
          onClick={() => openTutorial(activeTutorial.id)}
          type="button"
        >
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white">
            <BookOpenText className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ajuda rápida</span>
            <span className="block truncate text-sm font-semibold text-slate-950">{activeTutorial.title}</span>
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button aria-label="Fechar widget de tutoriais" className="absolute inset-0 bg-slate-950/45" onClick={closeDrawer} type="button" />

      <aside
        className={cn(
          'absolute right-0 top-0 h-[100dvh] w-full max-w-[680px] overflow-hidden border-l border-slate-200/80 bg-[linear-gradient(180deg,#eff7ff_0%,#ffffff_18%,#f8fffc_100%)] shadow-2xl',
          'md:right-5 md:top-5 md:h-[calc(100dvh-2.5rem)] md:max-w-[640px] md:rounded-[2rem] md:border',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200/80 bg-[linear-gradient(135deg,#0f172a_0%,#154d7c_52%,#0d9488_100%)] px-6 py-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <span className="inline-flex items-center rounded-full border border-white/16 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
                  Tutorial admin
                </span>
                <div className="space-y-2">
                  <h2 className="font-display text-2xl leading-tight">{activeTutorial.title}</h2>
                  <p className="max-w-xl text-sm leading-7 text-white/78">{activeTutorial.summary}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="border-white/20 bg-white/10 !text-white hover:bg-white/16" onClick={minimizeDrawer} size="icon" type="button" variant="outline">
                  <Minimize2 className="size-4" />
                </Button>
                <Button className="border-white/20 bg-white/10 !text-white hover:bg-white/16" onClick={closeDrawer} size="icon" type="button" variant="outline">
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200/80 px-6 py-4">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500" htmlFor="admin-tutorial-widget-select">
              Seleção de tutorial
            </label>
            <Select id="admin-tutorial-widget-select" onChange={(event) => selectTutorial(event.target.value)} value={activeTutorial.id}>
              {tutorials.map((tutorial) => (
                <option key={tutorial.id} value={tutorial.id}>
                  {tutorial.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <AdminTutorialContent compact tutorial={activeTutorial} />
          </div>

          <div className="border-t border-slate-200/80 bg-white/92 px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link className="text-sm font-medium text-sky-700 transition hover:text-sky-800 hover:underline" to={paths.admin.tutorials}>
                Abrir página completa
              </Link>
              <Button onClick={minimizeDrawer} type="button" variant="outline">
                Minimizar painel
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
