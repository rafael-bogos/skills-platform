'use client'

import { useEffect, useState } from 'react'
import CodeEditor from '@uiw/react-textarea-code-editor'
import { FileText, Maximize2, Minimize2 } from 'lucide-react'

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  const map: Record<string, string> = {
    md: 'markdown', markdown: 'markdown',
    js: 'javascript', jsx: 'jsx',
    ts: 'typescript', tsx: 'tsx',
    json: 'json', py: 'python',
    css: 'css', html: 'html',
    sh: 'bash', bash: 'bash',
    yaml: 'yaml', yml: 'yaml',
    xml: 'xml', sql: 'sql',
  }
  return map[ext] ?? 'markdown'
}

interface Props {
  filename: string
  value: string
  onChange?: (value: string) => void
  readOnly?: boolean
  rows?: number
  autoFocus?: boolean
  expandable?: boolean
}

export function CodeEditorField({
  filename, value, onChange, readOnly = false, rows = 10, autoFocus = false, expandable = false,
}: Props) {
  const [colorMode, setColorMode] = useState<'dark' | 'light'>('light')
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const update = () => {
      setColorMode(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Capture Escape to close fullscreen without bubbling to parent modal
  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setFullscreen(false)
      }
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [fullscreen])

  const editorProps = {
    value,
    language: getLanguage(filename),
    onChange: onChange ? (e: { target: { value: string } }) => onChange(e.target.value) : undefined,
    readOnly,
    'data-color-mode': colorMode,
    padding: 12,
  }

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col bg-white dark:bg-slate-900">
        <div className="flex shrink-0 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/60">
          <FileText className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="min-w-0 flex-1 truncate font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
            {filename}
          </span>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            title="Minimizar"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <CodeEditor
            {...editorProps}
            autoFocus
            style={{
              fontFamily: 'var(--font-mono), ui-monospace, monospace',
              fontSize: '13px',
              minHeight: 'calc(100vh - 48px)',
            }}
            className="border-0 rounded-none"
          />
        </div>
      </div>
    )
  }

  const minHeight = `${rows * 1.6}rem`

  return (
    <div className="relative">
      <CodeEditor
        {...editorProps}
        autoFocus={autoFocus}
        style={{
          fontFamily: 'var(--font-mono), ui-monospace, monospace',
          fontSize: '12px',
          minHeight,
          borderRadius: '0.5rem',
          width: '100%',
        }}
        className="rounded-lg border border-slate-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100 dark:border-slate-700 dark:focus-within:ring-primary-950"
      />
      {expandable && (
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded bg-white/80 text-slate-400 shadow-sm transition-colors hover:bg-white hover:text-slate-600 dark:bg-slate-800/80 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          title="Expandir editor"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
