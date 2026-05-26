'use client'

import { useState } from 'react'
import {
  Zap, Code2, Terminal, Copy, Check, Sparkles,
  ArrowRight, Lightbulb, Package, FolderOpen, FileCode, Eye, EyeOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Templates ────────────────────────────────────────────────────────────────

const SKILL_TEMPLATES = [
  {
    name: 'code-review',
    label: 'Code Review',
    category: 'development',
    description:
      'Revisa código buscando problemas de qualidade, segurança e performance. Auto-invocado quando o usuário compartilha código para revisão, pede feedback, menciona PR review ou mostra um diff.',
    body: `# Code Review

Ao revisar o código apresentado, analise sistematicamente:

## Qualidade e Legibilidade
- Nomes de variáveis, funções e classes são descritivos?
- Cada função tem responsabilidade única (SRP)?
- Há duplicação que poderia ser extraída?

## Performance
- Existem loops desnecessários ou consultas N+1?
- Operações pesadas estão no caminho crítico?

## Segurança
- Inputs do usuário estão sendo validados e sanitizados?
- Há credenciais hardcoded?
- O código é vulnerável a injeção (SQL, XSS, CSRF)?

## Testes
- A mudança tem cobertura de testes adequada?
- Casos de borda estão cobertos?

## Feedback
Priorize por severidade: Crítico → Importante → Sugestão.
Forneça sugestões construtivas com exemplos de código quando relevante.`,
  },
  {
    name: 'commit-message',
    label: 'Commit Message',
    category: 'development',
    description:
      'Gera mensagens de commit seguindo Conventional Commits. Auto-invocado quando o usuário quer criar um commit, pede uma mensagem de commit, ou após mudanças no código serem staged.',
    body: `# Commit Message

Analise as mudanças e gere uma mensagem seguindo **Conventional Commits**:

## Formato
\`\`\`
<tipo>(<escopo>): <descrição em inglês, imperativo>

[corpo — explica o "por quê", não o "o quê"]

[rodapé — breaking changes, closes #issue]
\`\`\`

## Tipos
- \`feat\`: nova funcionalidade
- \`fix\`: correção de bug
- \`docs\`: apenas documentação
- \`refactor\`: refatoração sem nova feature ou fix
- \`test\`: adição ou correção de testes
- \`chore\`: build, CI, dependências

## Regras
- Máximo 72 caracteres na primeira linha
- Breaking changes: use \`feat!:\` e documente no rodapé`,
  },
  {
    name: 'explain-code',
    label: 'Explicar Código',
    category: 'education',
    description:
      'Explica código de forma clara e adaptada ao contexto. Auto-invocado quando o usuário pergunta como algo funciona, pede para entender código, ou faz perguntas do tipo "o que faz X?".',
    body: `# Explain Code

Ao explicar o código, siga esta estrutura:

## 1. Resumo (1-2 frases)
O que este código faz, em linguagem simples.

## 2. Como Funciona
Explique o fluxo passo a passo. Use analogias quando a lógica for abstrata.

## 3. Partes Importantes
- Padrões de design ou idiomas da linguagem utilizados
- Decisões de implementação não-óbvias
- Possíveis armadilhas

## 4. Exemplo Prático
Mostre como o código seria chamado com um exemplo concreto.

## Regras
- Adapte o nível técnico ao contexto do projeto
- Se houver problemas, mencione-os ao final`,
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
        <span className="font-mono text-xs text-slate-500">{language ?? 'markdown'}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-200"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm">
        <code className="font-mono leading-relaxed text-slate-300">{code}</code>
      </pre>
    </div>
  )
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-950">
        <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LearnTab() {
  const [activeTemplate, setActiveTemplate] = useState(0)
  const tpl = SKILL_TEMPLATES[activeTemplate]

  const skillMdContent = `---
name: ${tpl.name}
description: >
  ${tpl.description}
---

${tpl.body}`

  return (
    <div className="space-y-14">

      {/* ── Hero ── */}
      <div className="rounded-2xl border border-primary-200 bg-gradient-to-br from-primary-50 to-purple-50 p-6 dark:border-primary-900/40 dark:from-primary-950/40 dark:to-purple-950/30">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-600 shadow-md">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              O que são Skills?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Skills são instruções em Markdown que o Claude carrega{' '}
              <strong>automaticamente</strong> quando detecta contexto relevante — sem você precisar
              digitar nenhum comando. Claude lê a{' '}
              <code className="rounded bg-primary-100 px-1.5 py-0.5 font-mono text-xs text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                description
              </code>{' '}
              de todas as skills disponíveis e decide, por conta própria, quando invocar cada uma.
            </p>
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                <strong>Skills ≠ Slash commands.</strong> Slash commands você invoca manualmente
                com <code className="font-mono">/nome</code>. Skills se auto-invocam quando Claude
                decide que são relevantes — você também pode invocá-las manualmente, mas a mágica
                está na auto-invocação.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Como funciona ── */}
      <div>
        <SectionTitle
          icon={Zap}
          title="Como a auto-invocação funciona"
          subtitle="As descriptions de todas as skills ficam sempre no contexto do Claude"
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              Icon: FileCode,
              step: '1',
              title: 'Descriptions no contexto',
              desc: 'Claude lê a description de todas as suas skills em cada conversa, mas o conteúdo completo só carrega quando necessário.',
            },
            {
              Icon: Sparkles,
              step: '2',
              title: 'Claude decide',
              desc: 'Quando o contexto da conversa bate com a description de uma skill, Claude carrega automaticamente o conteúdo completo.',
            },
            {
              Icon: Terminal,
              step: '3',
              title: 'Você também pode invocar',
              desc: 'Use /nome-da-skill para forçar a invocação. Ou adicione disable-model-invocation: true para só invocação manual.',
            },
          ].map(({ Icon, step, title, desc }) => (
            <div
              key={step}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                  {step}
                </span>
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Estrutura de arquivos ── */}
      <div>
        <SectionTitle
          icon={FolderOpen}
          title="Estrutura de uma Skill"
          subtitle="Skills são diretórios — não arquivos soltos. O SKILL.md é o ponto de entrada."
        />
        <CodeBlock
          language="estrutura de diretório"
          code={`~/.claude/skills/
└── minha-skill/           ← diretório com o nome da skill
    ├── SKILL.md           ← obrigatório: frontmatter + instruções
    ├── referencias.md     ← opcional: material de referência detalhado
    ├── exemplos.md        ← opcional: exemplos de uso
    └── scripts/
        └── helper.py      ← opcional: scripts de apoio`}
        />
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Mantenha o <code className="font-mono">SKILL.md</code> focado (máx. ~500 linhas). Material
            de referência detalhado vai em arquivos separados e o{' '}
            <code className="font-mono">SKILL.md</code> aponta para eles com links Markdown. O
            conteúdo extra só é carregado quando referenciado, economizando contexto.
          </p>
        </div>
      </div>

      {/* ── Anatomia do SKILL.md ── */}
      <div>
        <SectionTitle
          icon={Code2}
          title="Anatomia do SKILL.md"
          subtitle="Frontmatter controla comportamento; corpo contém as instruções"
        />
        <CodeBlock
          language="~/.claude/skills/minha-skill/SKILL.md"
          code={`---
name: minha-skill                   # nome de exibição (padrão: nome do diretório)
description: >                      # ← MAIS IMPORTANTE: Claude lê isso para decidir
  O que a skill faz E quando        #   quando auto-invocar. Inclua situações de uso
  deve ser invocada automaticamente. #   e palavras-chave do contexto esperado.

# Controle de invocação (opcionais):
disable-model-invocation: false     # true = só você invoca, nunca o Claude
user-invocable: true                # false = só Claude invoca, some do menu /

# Escopo e ferramentas (opcionais):
paths: "*.tsx, *.ts"                # limita auto-invocação a tipos de arquivo
allowed-tools: Bash(git *) Read     # pré-aprova ferramentas enquanto skill ativa

# Argumentos (opcionais):
arguments: [componente, destino]    # /minha-skill SearchBar React
---

# Título da Skill

Aqui ficam as instruções que o Claude vai seguir.
Use Markdown: cabeçalhos, listas, exemplos.

Referencie arquivos de apoio quando necessário:
- Para exemplos detalhados, veja [exemplos.md](exemplos.md)

Injete dados dinâmicos em tempo de execução:
Diff atual: !${'`'}git diff HEAD${'`'}
Versão Node: !${'`'}node --version${'`'}`}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
              Description — o campo mais importante
            </p>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Claude lê <em>apenas as descriptions</em> de todas as skills em cada turn. Quando o
              contexto bate, ele carrega o conteúdo completo. Escreva a description como uma
              combinação de &ldquo;o que faz&rdquo; + &ldquo;quando acionar&rdquo;.
            </p>
          </div>
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-400">
              Injeção dinâmica{' '}
              <code className="font-mono lowercase">!`comando`</code>
            </p>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              Comandos shell entre <code className="font-mono">!`...`</code> executam{' '}
              <em>antes</em> do Claude ver o conteúdo. A saída substitui o placeholder. Ideal para
              injetar git diff, versões, estado do projeto.
            </p>
          </div>
        </div>

        {/* Invocation matrix */}
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/60">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Matriz de controle de invocação
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-2.5 text-left font-medium text-slate-500">Frontmatter</th>
                  <th className="px-4 py-2.5 text-center font-medium text-slate-500">Você invoca</th>
                  <th className="px-4 py-2.5 text-center font-medium text-slate-500">Claude auto-invoca</th>
                  <th className="px-4 py-2.5 text-center font-medium text-slate-500">Description no contexto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {[
                  { config: '(padrão)', user: true, model: true, ctx: true },
                  { config: 'disable-model-invocation: true', user: true, model: false, ctx: false },
                  { config: 'user-invocable: false', user: false, model: true, ctx: true },
                ].map((row) => (
                  <tr key={row.config} className="bg-white dark:bg-slate-900">
                    <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">
                      {row.config}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.user ? (
                        <Eye className="mx-auto h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <EyeOff className="mx-auto h-3.5 w-3.5 text-slate-400" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.model ? (
                        <Eye className="mx-auto h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <EyeOff className="mx-auto h-3.5 w-3.5 text-slate-400" />
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {row.ctx ? (
                        <Eye className="mx-auto h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <EyeOff className="mx-auto h-3.5 w-3.5 text-slate-400" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Templates ── */}
      <div>
        <SectionTitle
          icon={Package}
          title="Exemplos de Skills"
          subtitle="Veja como diferentes skills são estruturadas na prática"
        />
        <div className="mb-4 flex flex-wrap gap-2">
          {SKILL_TEMPLATES.map((t, i) => (
            <button
              key={t.name}
              onClick={() => setActiveTemplate(i)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                activeTemplate === i
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-700 dark:bg-primary-950 dark:text-primary-300'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CodeBlock
          language={`~/.claude/skills/${tpl.name}/SKILL.md`}
          code={skillMdContent}
        />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Claude auto-invoca esta skill quando detecta contexto relevante, ou use{' '}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800 dark:text-slate-300">
            /{tpl.name}
          </code>{' '}
          para invocar manualmente
        </p>
      </div>

      {/* ── Instalando no Claude Code ── */}
      <div>
        <SectionTitle
          icon={Terminal}
          title="Instalando no Claude Code"
          subtitle="Crie o diretório da skill e o SKILL.md dentro dele"
        />
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Global — disponível em todos os projetos:
            </p>
            <CodeBlock
              language="bash"
              code={`mkdir -p ~/.claude/skills/${tpl.name}

cat > ~/.claude/skills/${tpl.name}/SKILL.md << 'EOF'
${skillMdContent}
EOF`}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Local — apenas no projeto atual:
            </p>
            <CodeBlock
              language="bash"
              code={`mkdir -p .claude/skills/${tpl.name}

cat > .claude/skills/${tpl.name}/SKILL.md << 'EOF'
${skillMdContent}
EOF`}
            />
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <strong className="text-blue-700 dark:text-blue-400">Detecção automática:</strong>{' '}
              Skills em <code className="font-mono text-xs">.claude/skills/</code> são recarregadas
              automaticamente quando você edita os arquivos na sessão atual. Criar um{' '}
              <em>novo diretório</em> de skill requer reiniciar o Claude Code.
            </p>
          </div>
        </div>
      </div>

      {/* ── Exportando da plataforma ── */}
      <div>
        <SectionTitle
          icon={FolderOpen}
          title="Exportando skills desta plataforma"
          subtitle="Como converter skills salvas aqui em arquivos locais para o Claude Code"
        />
        <ol className="space-y-3">
          {[
            'Abra a skill que deseja exportar clicando nela na aba "Minhas Skills".',
            'Copie o conteúdo do arquivo SKILL.md (e outros arquivos, se houver).',
            `Crie o diretório local: mkdir -p ~/.claude/skills/nome-da-skill`,
            'Cole o conteúdo em ~/.claude/skills/nome-da-skill/SKILL.md',
            'O campo "Descrição" da plataforma vai para o frontmatter description do SKILL.md — esse é o gatilho de auto-invocação.',
            'Reinicie o Claude Code se o diretório foi criado do zero.',
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-950 dark:text-primary-400">
                {i + 1}
              </span>
              <span className="pt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {text}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Boas práticas ── */}
      <div>
        <SectionTitle icon={Lightbulb} title="Boas práticas" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              title: 'Description é o gatilho',
              tip: 'Escreva a description como "o que faz + quando acionar". Claude usa exatamente isso para decidir a auto-invocação.',
            },
            {
              title: 'Use paths para escopar',
              tip: 'paths: "*.tsx, *.ts" limita auto-invocação a contextos relevantes. Evita que skill de frontend apareça em código Python.',
            },
            {
              title: 'SKILL.md focado',
              tip: 'Mantenha SKILL.md com menos de 500 linhas. Detalhes vão em arquivos de apoio referenciados por links Markdown.',
            },
            {
              title: 'Injeção dinâmica para dados ao vivo',
              tip: 'Use !`git diff` ou !`cat package.json` para injetar estado atual do projeto. Claude recebe os dados reais, não instruções para buscá-los.',
            },
            {
              title: 'Uma responsabilidade por skill',
              tip: 'Skills focadas têm descriptions mais precisas e se auto-invocam no momento certo. Megaprompts genéricos confundem a seleção.',
            },
            {
              title: 'Itere a description',
              tip: 'Se a skill não estiver se auto-invocando quando deveria, refine a description com palavras-chave do contexto real que você usa.',
            },
          ].map(({ title, tip }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {tip}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
