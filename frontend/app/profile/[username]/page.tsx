import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'

const ROLE_LABELS: Record<string, string> = {
  walker: 'WALKER', searcher: 'SEARCHER', brand: 'BRAND',
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true, username: true, displayName: true,
      avatarUrl: true, bio: true, roles: true,
      points: true, totalEarned: true, createdAt: true,
      _count: { select: { outfits: true } },
    },
  })
  if (!user) notFound()

  const outfits = await prisma.outfit.findMany({
    where: { walkerId: user.id, isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: {
      id: true, title: true, imageUrl: true,
      viewCount: true, createdAt: true,
    },
  })

  const isOwn = session.user?.id === user.id
  const roles = user.roles.split(',').filter(Boolean)

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center justify-between">
        <Link href="/map" className="text-gray-500 text-xl">←</Link>
        <span className="font-bold">@{user.username}</span>
        {isOwn && (
          <Link href="/settings" className="text-sm text-[#E8315B]">編集</Link>
        )}
      </header>

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        {/* プロフィールヘッダー */}
        <div className="bg-white px-4 py-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden shrink-0">
              {user.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.avatarUrl} alt={user.displayName ?? user.username} className="w-full h-full object-cover" />
                : <span className="flex items-center justify-center w-full h-full text-4xl">👤</span>}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-xl truncate">{user.displayName ?? user.username}</h1>
              <p className="text-gray-400 text-sm">@{user.username}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {roles.map((r) => (
                  <span key={r} className="text-xs bg-[#0A0A0A] text-white px-2 py-0.5 rounded-full">
                    {ROLE_LABELS[r] ?? r}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {user.bio && (
            <p className="text-sm text-gray-600 leading-relaxed">{user.bio}</p>
          )}

          {/* 統計 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="font-bold text-lg">{user._count.outfits}</p>
              <p className="text-xs text-gray-500">コーデ</p>
            </div>
            {roles.includes('walker') && (
              <>
                <div className="text-center">
                  <p className="font-bold text-lg text-[#E8315B]">{user.totalEarned.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">累計pt</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{user.points.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">残高pt</p>
                </div>
              </>
            )}
          </div>

          {/* BRANDからの依頼ボタン */}
          {!isOwn && roles.includes('walker') && (
            <Link
              href={`/brand/request/new?walkerId=${user.id}`}
              className="block w-full text-center bg-[#111111] text-white py-3 rounded-xl text-sm font-medium"
            >
              着用依頼を送る
            </Link>
          )}
        </div>

        {/* コーデグリッド */}
        {outfits.length > 0 && (
          <div className="px-4 py-4">
            <h2 className="font-bold mb-3">コーデ</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {outfits.map((outfit) => (
                <Link key={outfit.id} href={`/outfit/${outfit.id}`} className="block aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {outfit.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={outfit.imageUrl} alt={outfit.title ?? 'コーデ'} className="w-full h-full object-cover" />
                    : <span className="flex items-center justify-center w-full h-full text-3xl">👗</span>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
