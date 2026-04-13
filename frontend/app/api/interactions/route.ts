import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const INCENTIVE_POINTS = {
  view: 1,
  click: 5,
  purchase: 100,
} as const

const schema = z.object({
  outfitId: z.string(),
  itemId: z.string().optional(),
  type: z.enum(['view', 'click', 'purchase']),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '入力が不正です' }, { status: 400 })
  }

  const { outfitId, itemId, type } = parsed.data
  const searcherId = session.user.id

  // コーデの存在確認とwalker_id取得
  const outfit = await prisma.outfit.findUnique({
    where: { id: outfitId },
    select: { walkerId: true },
  })
  if (!outfit) {
    return NextResponse.json({ error: 'コーデが見つかりません' }, { status: 404 })
  }

  // 自分自身の閲覧はポイント付与しない
  const isSelf = outfit.walkerId === searcherId

  // view は同一ユーザー1日1回まで
  if (type === 'view') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const existing = await prisma.interaction.findFirst({
      where: {
        outfitId,
        searcherId,
        type: 'view',
        createdAt: { gte: today, lt: tomorrow },
      },
    })
    if (existing) {
      return NextResponse.json({ skipped: true, reason: '本日は閲覧済みです' })
    }
  }

  const points = isSelf ? 0 : INCENTIVE_POINTS[type]

  // トランザクション：インタラクション記録 + ポイント付与 + カウント更新
  await prisma.$transaction(async (tx) => {
    await tx.interaction.create({
      data: {
        outfitId,
        itemId: itemId ?? null,
        searcherId,
        type,
        pointsAwarded: points,
      },
    })

    if (points > 0) {
      await tx.user.update({
        where: { id: outfit.walkerId },
        data: {
          points: { increment: points },
          totalEarned: { increment: points },
        },
      })
    }

    if (type === 'view') {
      await tx.outfit.update({
        where: { id: outfitId },
        data: { viewCount: { increment: 1 } },
      })
    }
    if (type === 'purchase') {
      await tx.outfit.update({
        where: { id: outfitId },
        data: { buyCount: { increment: 1 } },
      })
    }
  })

  return NextResponse.json({ success: true, pointsAwarded: points })
}
