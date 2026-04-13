import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'

export const dynamic = 'force-dynamic'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ qr?: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/login')

  // QRコードスキャン時の自動遷移
  const { qr } = await searchParams
  if (qr) {
    const event = await prisma.event.findFirst({ where: { qrCode: qr } })
    if (event) redirect(`/events/${event.id}`)
  }

  const now = new Date()
  const events = await prisma.event.findMany({
    orderBy: { startAt: 'desc' },
    include: { _count: { select: { outfits: true } } },
  })

  const isActive = (e: typeof events[0]) =>
    e.isActive && e.startAt && e.endAt && e.startAt <= now && e.endAt >= now

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center">
        <h1 className="font-bold text-lg">イベント</h1>
      </header>

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 py-4 space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🎪</p>
            <p className="text-sm">開催予定のイベントはありません</p>
          </div>
        ) : (
          events.map((event) => {
            const active = isActive(event)
            return (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {active && (
                        <span className="text-xs bg-[#E8315B] text-white px-2 py-0.5 rounded-full animate-pulse shrink-0">
                          開催中
                        </span>
                      )}
                      <h2 className="font-bold truncate">{event.name}</h2>
                    </div>
                    {event.venueName && (
                      <p className="text-sm text-gray-500">📍 {event.venueName}</p>
                    )}
                    {event.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                      {event.startAt && (
                        <span>
                          {new Date(event.startAt).toLocaleDateString('ja-JP', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                          {event.endAt && ` 〜 ${new Date(event.endAt).toLocaleDateString('ja-JP', {
                            month: 'short', day: 'numeric',
                          })}`}
                        </span>
                      )}
                      <span>{event._count.outfits} コーデ</span>
                    </div>
                  </div>
                  <span className="text-2xl shrink-0">🎪</span>
                </div>
              </Link>
            )
          })
        )}
      </main>

      <BottomNav />
    </div>
  )
}
