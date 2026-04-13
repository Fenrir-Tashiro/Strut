import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const userId = session.user.id

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // 過去7日の開始日
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [profile, todayOutfit, pendingRequests, weeklyInteractions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, totalEarned: true, displayName: true, username: true },
    }),

    // 今日のコーデ
    prisma.outfit.findFirst({
      where: { walkerId: userId, createdAt: { gte: today, lt: tomorrow } },
      select: { id: true, title: true, viewCount: true, buyCount: true },
    }),

    // 未読の着用依頼数
    prisma.brandRequest.count({
      where: { walkerId: userId, status: 'pending' },
    }),

    // 過去7日のインタラクション（日別集計用）
    prisma.interaction.findMany({
      where: {
        outfit: { walkerId: userId },
        createdAt: { gte: sevenDaysAgo },
      },
      select: { type: true, pointsAwarded: true, createdAt: true },
    }),
  ])

  // 今日のビュー数・クリック数（今日のコーデ限定）
  let todayViews = 0
  let todayClicks = 0
  if (todayOutfit) {
    const todayStats = await prisma.interaction.groupBy({
      by: ['type'],
      where: {
        outfitId: todayOutfit.id,
        createdAt: { gte: today, lt: tomorrow },
      },
      _count: { type: true },
    })
    todayStats.forEach((s) => {
      if (s.type === 'view') todayViews = s._count.type
      if (s.type === 'click') todayClicks = s._count.type
    })
  }

  // 過去7日の日別ポイントグラフデータ
  const chartData: { date: string; points: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    const pts = weeklyInteractions
      .filter((ia) => {
        const iaDate = new Date(ia.createdAt)
        iaDate.setHours(0, 0, 0, 0)
        return iaDate.getTime() === d.getTime()
      })
      .reduce((sum, ia) => sum + ia.pointsAwarded, 0)
    chartData.push({ date: label, points: pts })
  }

  return NextResponse.json({
    profile,
    todayOutfit,
    todayViews,
    todayClicks,
    pendingRequests,
    chartData,
  })
}
