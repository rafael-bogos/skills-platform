import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { SkillStatus } from '@prisma/client'

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(skills)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar skills' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, category, status, skillContent } = body

    if (!name?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'name e description são obrigatórios' }, { status: 400 })
    }

    const files = [
      {
        id: crypto.randomUUID(),
        name: 'SKILL.md',
        content: skillContent?.trim() ?? buildDefaultSkillMd(name.trim(), description.trim()),
      },
    ]

    const skill = await prisma.skill.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        category: category?.trim() ?? '',
        status: (status as SkillStatus) ?? 'draft',
        files,
      },
    })

    return NextResponse.json(skill, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar skill' }, { status: 500 })
  }
}

function buildDefaultSkillMd(name: string, description: string) {
  return `---
name: ${name}
description: |
  ${description}
---

# ${name}

${description}

---

## Como usar

Descreva aqui como o Claude deve executar esta skill.

## Exemplos

Adicione exemplos de uso.
`
}
