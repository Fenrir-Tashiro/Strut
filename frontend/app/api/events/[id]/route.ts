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

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      outfits: {
        where: { isEvent: true },
        include: {
          walker: {
            select: { id: true, username: true, displayName: true, avatarUrl: true },
          },
          items: { orderBy: { sortOrder: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!event) {
    return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 })
  }

  return NextResponse.json({ event })
}
