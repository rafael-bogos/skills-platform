'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Code2, PenLine, BarChart2, SearchCheck,
  Container, Search, Shapes, ChevronDown, Check,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export const CATEGORIES: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: 'Código',   label: 'Código',   Icon: Code2       },
  { value: 'Escrita',  label: 'Escrita',  Icon: PenLine     },
  { value: 'Análise',  label: 'Análise',  Icon: BarChart2   },
  { value: 'Revisão',  label: 'Revisão',  Icon: SearchCheck },
  { value: 'DevOps',   label: 'DevOps',   Icon: Container   },
  { value: 'Pesquisa', label: 'Pesquisa', Icon: Search      },
  { value: 'Outro',    label: 'Outro',    Icon: Shapes      },
]

export function getCategoryIcon(category: string): LucideIcon {
  return CATEGORIES.find((c) => c.value === category)?.Icon ?? Shapes
}

export default function CategorySelect({
  value,
  onChange,
  dropdownDirection = 'up',
}: {
  value: string
  onChange: (v: string) => void
  dropdownDirection?: 'up' | 'down'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = CATEGORIES.find((c) => c.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-100 focus:ring-offset-0',
          'dark:bg-slate-800 dark:focus:ring-primary-950',
          open
            ? 'border-primary-500 dark:border-primary-500'
            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600',
        )}
      >
        {selected ? (
          <span className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <selected.Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            {selected.label}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">Selecione...</span>
        )}
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          className={cn(
            'absolute z-20 w-full overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800',
            dropdownDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
        >
          <li>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                !value
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                  : 'text-slate-400 hover:bg-slate-50 dark:text-slate-500 dark:hover:bg-slate-700/50',
              )}
            >
              <span className="flex h-4 w-4 items-center justify-center">
                <span className="h-px w-3 bg-current" />
              </span>
              Nenhuma
            </button>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.value}>
              <button
                type="button"
                onClick={() => { onChange(c.value); setOpen(false) }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                  value === c.value
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50',
                )}
              >
                <c.Icon
                  className={cn(
                    'h-4 w-4',
                    value === c.value ? 'text-primary-500 dark:text-primary-400' : 'text-slate-400 dark:text-slate-500',
                  )}
                />
                {c.label}
                {value === c.value && (
                  <Check className="ml-auto h-3.5 w-3.5 text-primary-500 dark:text-primary-400" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
