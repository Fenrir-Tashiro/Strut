import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

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

  if (!outfit) {
    return NextResponse.json({ error: 'コーデが見つかりません' }, { status: 404 })
  }

  return NextResponse.json({ outfit })
}
