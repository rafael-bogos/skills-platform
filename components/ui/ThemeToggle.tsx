'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evita hydration mismatch — só renderiza após montar no cliente
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-8 w-8" />

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg',
        'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
        'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
        'transition-colors duration-150',
        className,
      )}
    >
      {isDark ? (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14A7 7 0 0012 5z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  )
}
