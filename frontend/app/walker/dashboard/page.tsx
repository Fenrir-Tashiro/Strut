import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'
import EarningsChart from '@/components/walker/EarningsChart'

export const dynamic = 'force-dynamic'

export default async function WalkerDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  })
  if (!user?.roles.includes('walker')) redirect('/map')

  const userId = session.user.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [profile, todayOutfit, pendingRequests, weeklyInteractions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, totalEarned: true, displayName: true, username: true },
    }),
    prisma.outfit.findFirst({
      where: { walkerId: userId, createdAt: { gte: today, lt: tomorrow } },
      select: { id: true, title: true, viewCount: true, buyCount: true },
    }),
    prisma.brandRequest.count({
      where: { walkerId: userId, status: 'pending' },
    }),
    prisma.interaction.findMany({
      where: { outfit: { walkerId: userId }, createdAt: { gte: sevenDaysAgo } },
      select: { type: true, pointsAwarded: true, createdAt: true },
    }),
  ])

  // 今日のビュー数・クリック数
  let todayViews = 0
  let todayClicks = 0
  if (todayOutfit) {
    const stats = await prisma.interaction.groupBy({
      by: ['type'],
      where: { outfitId: todayOutfit.id, createdAt: { gte: today, lt: tomorrow } },
      _count: { type: true },
    })
    stats.forEach((s) => {
      if (s.type === 'view') todayViews = s._count.type
      if (s.type === 'click') todayClicks = s._count.type
    })
  }

  // 過去7日グラフデータ
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (6 - i))
    const label = `${d.getMonth() + 1}/${d.getDate()}`
    const pts = weeklyInteractions
      .filter((ia) => {
        const iaDate = new Date(ia.createdAt)
        iaDate.setHours(0, 0, 0, 0)
        return iaDate.getTime() === d.getTime()
      })
      .reduce((sum, ia) => sum + ia.pointsAwarded, 0)
    return { date: label, points: pts }
  })

  const weeklyTotal = chartData.reduce((sum, d) => sum + d.points, 0)

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center justify-between">
        <h1 className="font-bold text-lg">WALKERダッシュボード</h1>
        {pendingRequests > 0 && (
          <Link href="/requests" className="relative">
            <span className="text-xl">📩</span>
            <span className="absolute -top-1 -right-1 bg-[#E8315B] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {pendingRequests > 9 ? '9+' : pendingRequests}
            </span>
          </Link>
        )}
      </header>

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 py-4 space-y-4">

        {/* ポイント残高 */}
        <section className="bg-[#0A0A0A] rounded-2xl p-5 text-white">
          <p className="text-gray-400 text-sm mb-1">ポイント残高</p>
          <p className="text-4xl font-bold text-[#E8315B]">
            {(profile?.points ?? 0).toLocaleString()}
            <span className="text-lg font-normal text-gray-400 ml-1">pt</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            累計獲得 {(profile?.totalEarned ?? 0).toLocaleString()} pt
            （≒ ¥{(profile?.totalEarned ?? 0).toLocaleString()}）
          </p>
        </section>

        {/* 今日のコーデ */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">今日のコーデ</h2>
            {!todayOutfit && (
              <span className="text-xs bg-[#E8315B] text-white px-2 py-0.5 rounded-full animate-pulse">
                未登録
              </span>
            )}
          </div>

          {todayOutfit ? (
            <div className="space-y-3">
              <Link href={`/outfit/${todayOutfit.id}`} className="block">
                <p className="font-medium text-sm truncate">{todayOutfit.title ?? '今日のコーデ'}</p>
              </Link>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F5F5F5] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{todayViews}</p>
                  <p className="text-xs text-gray-500 mt-0.5">👁 ビュー</p>
                </div>
                <div className="bg-[#F5F5F5] rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold">{todayClicks}</p>
                  <p className="text-xs text-gray-500 mt-0.5">🛒 クリック</p>
                </div>
              </div>
              <Link
                href={`/walker/edit/${todayOutfit.id}`}
                className="block text-center text-sm border border-gray-200 rounded-xl py-2 text-gray-500 hover:border-[#E8315B] hover:text-[#E8315B] transition-colors"
              >
                編集する
              </Link>
            </div>
          ) : (
            <Link
              href="/walker/register"
              className="block w-full text-center bg-[#E8315B] text-white py-3 rounded-xl font-medium text-sm"
            >
              今日のコーデを登録する
            </Link>
          )}
        </section>

        {/* 収益グラフ */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">過去7日間の収益</h2>
            <span className="text-sm font-bold text-[#E8315B]">+{weeklyTotal} pt</span>
          </div>
          <EarningsChart data={chartData} />
          <p className="text-xs text-gray-400 mt-2 text-center">100 pt = ¥100 相当</p>
        </section>

        {/* 着用依頼 */}
        <section className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold">着用依頼</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                未対応 <span className="font-bold text-[#E8315B]">{pendingRequests}</span> 件
              </p>
            </div>
            <Link
              href="/requests"
              className="text-sm bg-[#111111] text-white px-4 py-2 rounded-xl"
            >
              受信トレイ
            </Link>
          </div>
        </section>

        {/* クイックリンク */}
        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/walker/history"
            className="bg-white rounded-2xl p-4 shadow-sm text-center hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-1">👗</p>
            <p className="text-sm font-medium">コーデ履歴</p>
          </Link>
          <Link
            href={`/profile/${profile?.username}`}
            className="bg-white rounded-2xl p-4 shadow-sm text-center hover:shadow-md transition-shadow"
          >
            <p className="text-2xl mb-1">👤</p>
            <p className="text-sm font-medium">プロフィール</p>
          </Link>
        </section>

      </main>

      <BottomNav />
    </div>
  )
}
