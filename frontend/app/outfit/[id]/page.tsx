import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import OutfitDetailClient from './OutfitDetailClient'

export default async function OutfitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const { id } = await params

  const outfit = await prisma.outfit.findUnique({
    where: { id },
    include: {
      walker: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          totalEarned: true,
        },
      },
      items: { orderBy: { sortOrder: 'asc' } },
      event: { select: { id: true, name: true } },
    },
  })

  if (!outfit) notFound()

  // Date を JSON シリアライズ可能な形に変換
  const serialized = {
    ...outfit,
    date: outfit.date.toISOString(),
    createdAt: outfit.createdAt.toISOString(),
    items: outfit.items.map((item) => ({ ...item })),
  }

  return <OutfitDetailClient outfit={serialized} />
}
