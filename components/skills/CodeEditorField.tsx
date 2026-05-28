'use client'

import { useEffect, useState } from 'react'
import CodeEditor from '@uiw/react-textarea-code-editor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { Components } from 'react-markdown'
import { FileText, Maximize2, Minimize2, Code2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

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

function isMarkdownFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return ext === 'md' || ext === 'markdown'
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

function MarkdownPreview({ content }: { content: string }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const update = () => setIsDark(document.documentElement.classList.contains('dark'))
    update()
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const components: Components = {
    h1: ({ children }) => (
      <h1 className="mb-3 mt-6 border-b border-slate-200 pb-2 text-2xl font-semibold text-slate-900 first:mt-0 dark:border-slate-700 dark:text-slate-100">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-2 mt-6 border-b border-slate-200 pb-1.5 text-xl font-semibold text-slate-900 dark:border-slate-700 dark:text-slate-100">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-2 mt-5 text-base font-semibold text-slate-900 dark:text-slate-100">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="mb-1 mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">{children}</h4>
    ),
    p: ({ children }) => (
      <p className="mb-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{children}</p>
    ),
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="mb-3 list-disc space-y-1 pl-6 text-sm text-slate-700 dark:text-slate-300">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mb-3 list-decimal space-y-1 pl-6 text-sm text-slate-700 dark:text-slate-300">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="mb-3 border-l-4 border-slate-300 pl-4 text-sm italic text-slate-500 dark:border-slate-600 dark:text-slate-400">
        {children}
      </blockquote>
    ),
    hr: () => <hr className="my-4 border-slate-200 dark:border-slate-700" />,
    table: ({ children }) => (
      <div className="mb-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-slate-50 dark:bg-slate-800">{children}</thead>,
    th: ({ children }) => (
      <th className="border border-slate-200 px-4 py-2 text-left text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border border-slate-200 px-4 py-2 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300">
        {children}
      </td>
    ),
    code: ({ className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className ?? '')
      const isBlock = !!match
      if (isBlock) {
        return (
          <SyntaxHighlighter
            language={match[1]}
            style={isDark ? vscDarkPlus : vs}
            customStyle={{
              margin: '0 0 12px',
              borderRadius: '6px',
              fontSize: '12px',
              lineHeight: '1.6',
              border: isDark ? '1px solid #3e3e42' : '1px solid #e2e8f0',
            }}
            showLineNumbers={false}
            wrapLines
            PreTag="div"
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        )
      }
      return (
        <code
          className="rounded px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:text-slate-200"
          style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }}
          {...props}
        >
          {children}
        </code>
      )
    },
    pre: ({ children }) => <>{children}</>,
  }

  if (!content.trim()) {
    return (
      <div className="flex min-h-[6rem] items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-[#1e1e1e]">
        <p className="italic text-slate-400 dark:text-slate-500">Sem conteúdo</p>
      </div>
    )
  }

  return (
    <div className="min-h-[6rem] rounded-lg border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-[#1e1e1e]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}

function ModeToggle({ mode, onChange }: { mode: 'code' | 'preview'; onChange: (m: 'code' | 'preview') => void }) {
  return (
    <div className="flex items-center rounded-md border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
      <button
        type="button"
        onClick={() => onChange('code')}
        className={cn(
          'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
          mode === 'code'
            ? 'bg-white text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-200'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
        )}
      >
        <Code2 className="h-3 w-3" />
        Código
      </button>
      <button
        type="button"
        onClick={() => onChange('preview')}
        className={cn(
          'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors',
          mode === 'preview'
            ? 'bg-white text-slate-700 shadow-sm dark:bg-slate-700 dark:text-slate-200'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
        )}
      >
        <Eye className="h-3 w-3" />
        Preview
      </button>
    </div>
  )
}

export function CodeEditorField({
  filename, value, onChange, readOnly = false, rows = 10, autoFocus = false, expandable = false,
}: Props) {
  const [colorMode, setColorMode] = useState<'dark' | 'light'>('light')
  const [fullscreen, setFullscreen] = useState(false)
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code')
  const isMd = isMarkdownFile(filename)

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
          {isMd && <ModeToggle mode={viewMode} onChange={setViewMode} />}
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
          {viewMode === 'preview' && isMd ? (
            <div className="mx-auto max-w-3xl px-8 py-6">
              <MarkdownPreview content={value} />
            </div>
          ) : (
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
          )}
        </div>
      </div>
    )
  }

  const minHeight = `${rows * 1.6}rem`

  return (
    <div className="space-y-1.5">
      {isMd && (
        <div className="flex justify-end">
          <ModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
      )}
      <div className="relative">
        {viewMode === 'preview' && isMd ? (
          <MarkdownPreview content={value} />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
