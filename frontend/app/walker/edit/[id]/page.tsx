import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import WalkerEditClient from './WalkerEditClient'

export default async function WalkerEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const { id } = await params

  const outfit = await prisma.outfit.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })

  if (!outfit) notFound()
  if (outfit.walkerId !== session.user.id) redirect('/map')

  const serialized = {
    ...outfit,
    date: outfit.date.toISOString(),
    createdAt: outfit.createdAt.toISOString(),
    items: outfit.items.map((item) => ({ ...item })),
  }

  return <WalkerEditClient outfit={serialized} />
}
