import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: '未対応', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: '承認済み', color: 'bg-green-100 text-green-700' },
  declined: { label: '拒否', color: 'bg-gray-100 text-gray-500' },
}

export default async function BrandDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  })
  if (!user?.roles.includes('brand')) redirect('/map')

  const requests = await prisma.brandRequest.findMany({
    where: { brandId: session.user.id },
    include: {
      walker: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const stats = {
    total: requests.length,
    accepted: requests.filter((r) => r.status === 'accepted').length,
    pending: requests.filter((r) => r.status === 'pending').length,
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center">
        <h1 className="font-bold text-lg">BRANDダッシュボード</h1>
      </header>

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 py-4 space-y-4">

        {/* 統計 */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '総依頼数', value: stats.total },
            { label: '承認済み', value: stats.accepted },
            { label: '未対応', value: stats.pending },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <Link
          href="/brand/request/new"
          className="block w-full text-center bg-[#E8315B] text-white py-3 rounded-2xl font-bold shadow-md"
        >
          ＋ 着用依頼を送る
        </Link>

        {/* 依頼一覧 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-bold">送信済み依頼</h2>
            <Link href="/brand/requests" className="text-xs text-[#E8315B]">すべて見る</Link>
          </div>

          {requests.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-sm shadow-sm">
              まだ依頼を送っていません
            </div>
          ) : (
            requests.map((req) => {
              const s = STATUS_LABEL[req.status] ?? STATUS_LABEL.pending
              return (
                <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-base shrink-0">
                      {req.walker.avatarUrl
                        ? <img src={req.walker.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                        : '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {req.walker.displayName ?? req.walker.username}
                      </p>
                      <p className="text-xs text-gray-400">@{req.walker.username}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{req.title}</p>
                  {req.fee != null && (
                    <p className="text-xs text-gray-500 mt-0.5">報酬 ¥{req.fee.toLocaleString()}</p>
                  )}
                </div>
              )
            })
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
