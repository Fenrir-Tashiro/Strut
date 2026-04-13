import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const events = await prisma.event.findMany({
    orderBy: { startAt: 'desc' },
    include: {
      _count: { select: { outfits: true } },
    },
  })

  return NextResponse.json({ events })
}
