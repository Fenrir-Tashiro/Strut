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

export default async function BrandRequestsPage() {
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
  })

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/brand/dashboard" className="text-gray-500 text-xl">←</Link>
          <h1 className="font-bold text-lg">送信済み依頼</h1>
        </div>
        <Link href="/brand/request/new" className="text-sm bg-[#E8315B] text-white px-3 py-1.5 rounded-full">
          ＋ 新規
        </Link>
      </header>

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 py-4 space-y-3">
        {requests.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📮</p>
            <p className="text-sm">まだ依頼を送っていません</p>
          </div>
        ) : (
          requests.map((req) => {
            const s = STATUS_LABEL[req.status] ?? STATUS_LABEL.pending
            return (
              <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {req.walker.avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={req.walker.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : '👤'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{req.walker.displayName ?? req.walker.username}</p>
                      <p className="text-xs text-gray-400">@{req.walker.username}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${s.color}`}>{s.label}</span>
                </div>
                <p className="font-medium text-sm">{req.title}</p>
                {req.description && <p className="text-xs text-gray-500 line-clamp-2">{req.description}</p>}
                <div className="flex gap-3 text-xs text-gray-400">
                  {req.fee != null && <span>報酬 ¥{req.fee.toLocaleString()}</span>}
                  {req.deadline && <span>期限 {new Date(req.deadline).toLocaleDateString('ja-JP')}</span>}
                  <span>{new Date(req.createdAt).toLocaleDateString('ja-JP')}</span>
                </div>
              </div>
            )
          })
        )}
      </main>

      <BottomNav />
    </div>
  )
}
