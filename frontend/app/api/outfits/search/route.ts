import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? ''

  const outfits = await prisma.outfit.findMany({
    where: {
      isActive: true,
      ...(q ? {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { walker: { OR: [{ username: { contains: q } }, { displayName: { contains: q } }] } },
          { items: { some: { OR: [{ brandName: { contains: q } }, { itemName: { contains: q } }] } } },
        ],
      } : {}),
      ...(category ? { items: { some: { category } } } : {}),
    },
    include: {
      walker: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      items: { orderBy: { sortOrder: 'asc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  return NextResponse.json({ outfits })
}
