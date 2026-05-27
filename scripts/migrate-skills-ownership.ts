/**
 * Script para identificar skills sem dono (userId=null, organizationId=null)
 * criadas antes do sistema de auth.
 *
 * Uso:
 *   npx tsx scripts/migrate-skills-ownership.ts
 *
 * Para reatribuir a um usuário, descomente a seção de updateMany
 * e substitua TARGET_USER_ID pelo id do usuário no banco.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const orphaned = await prisma.skill.findMany({
    where: { userId: null, organizationId: null },
    select: { id: true, name: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`\nSkills sem dono encontradas: ${orphaned.length}`)
  orphaned.forEach((s) => console.log(`  • [${s.id}] ${s.name} (${s.createdAt.toISOString()})`))

  // Para reatribuir a um usuário específico, descomente:
  // const TARGET_USER_ID = 'SEU_USER_ID_AQUI'
  // const { count } = await prisma.skill.updateMany({
  //   where: { userId: null, organizationId: null },
  //   data: { userId: TARGET_USER_ID },
  // })
  // console.log(`\nReatribuídas ${count} skills para o usuário ${TARGET_USER_ID}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
