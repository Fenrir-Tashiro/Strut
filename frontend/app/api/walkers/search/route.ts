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

  const walkers = await prisma.user.findMany({
    where: {
      roles: { contains: 'walker' },
      OR: [
        { username: { contains: q } },
        { displayName: { contains: q } },
      ],
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
      totalEarned: true,
      _count: { select: { outfits: true } },
    },
    take: 20,
    orderBy: { totalEarned: 'desc' },
  })

  return NextResponse.json({ walkers })
}
