import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { SkillStatus } from '@prisma/client'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const skill = await prisma.skill.findUnique({ where: { id } })
    if (!skill) return NextResponse.json({ error: 'Skill não encontrada' }, { status: 404 })
    return NextResponse.json(skill)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar skill' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const body = await req.json()
    const { name, description, category, status, files } = body

    const skill = await prisma.skill.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(category !== undefined && { category: category.trim() }),
        ...(status !== undefined && { status: status as SkillStatus }),
        ...(files !== undefined && {
          files: files.map((f: { id?: string; name: string; content: string }) => ({
            id: f.id ?? crypto.randomUUID(),
            name: f.name,
            content: f.content,
          })),
        }),
      },
    })

    return NextResponse.json(skill)
  } catch (err: unknown) {
    const isNotFound =
      err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2025'
    if (isNotFound) return NextResponse.json({ error: 'Skill não encontrada' }, { status: 404 })
    return NextResponse.json({ error: 'Erro ao atualizar skill' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    await prisma.skill.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    const isNotFound =
      err instanceof Error && 'code' in err && (err as { code: string }).code === 'P2025'
    if (isNotFound) return NextResponse.json({ error: 'Skill não encontrada' }, { status: 404 })
    return NextResponse.json({ error: 'Erro ao deletar skill' }, { status: 500 })
  }
}
