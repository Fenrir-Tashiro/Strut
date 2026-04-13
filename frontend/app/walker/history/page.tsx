import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'

export default async function WalkerHistoryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/auth/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  })
  if (!user?.roles.includes('walker')) redirect('/map')

  const outfits = await prisma.outfit.findMany({
    where: { walkerId: session.user.id },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center">
        <h1 className="font-bold text-lg">コーデ履歴</h1>
      </header>

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 py-4 space-y-3">
        {outfits.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">👗</p>
            <p className="text-sm">まだコーデがありません</p>
            <Link
              href="/walker/register"
              className="inline-block mt-4 bg-[#E8315B] text-white text-sm px-6 py-2 rounded-full"
            >
              最初のコーデを登録する
            </Link>
          </div>
        ) : (
          outfits.map((outfit) => {
            const isToday =
              new Date(outfit.createdAt).toDateString() === new Date().toDateString()
            return (
            <div key={outfit.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <Link href={`/outfit/${outfit.id}`} className="block">
              <div className="flex gap-3 p-3">
                {outfit.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={outfit.imageUrl}
                    alt={outfit.title ?? 'コーデ'}
                    className="w-20 h-20 object-cover rounded-xl shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-xl shrink-0 flex items-center justify-center text-gray-300 text-2xl">
                    👗
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate">{outfit.title ?? '今日のコーデ'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(outfit.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    <span>👁 {outfit.viewCount}</span>
                    <span>🛒 {outfit.buyCount}</span>
                    <span>{outfit.items.length} アイテム</span>
                  </div>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      outfit.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {outfit.isActive ? '公開中' : '非公開'}
                  </span>
                </div>
              </div>
              </Link>
              {isToday && (
                <div className="px-3 pb-3">
                  <Link
                    href={`/walker/edit/${outfit.id}`}
                    className="block w-full text-center text-sm border border-[#E8315B] text-[#E8315B] rounded-xl py-2 hover:bg-[#E8315B] hover:text-white transition-colors"
                  >
                    編集する
                  </Link>
                </div>
              )}
            </div>
            )
          })
        )}
      </main>

      <BottomNav />
    </div>
  )
}
