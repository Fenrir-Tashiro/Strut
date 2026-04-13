import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import QRCode from 'qrcode'
import EventDetailClient from './EventDetailClient'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/auth/login')

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

  if (!event) notFound()

  const now = new Date()
  const isLive =
    event.isActive &&
    !!event.startAt &&
    !!event.endAt &&
    event.startAt <= now &&
    event.endAt >= now

  // QRコード生成
  let qrDataUrl: string | null = null
  if (event.qrCode) {
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
    qrDataUrl = await QRCode.toDataURL(`${baseUrl}/events?qr=${event.qrCode}`, {
      width: 200,
      margin: 2,
    })
  }

  const serialized = {
    ...event,
    startAt: event.startAt?.toISOString() ?? null,
    endAt: event.endAt?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    outfits: event.outfits.map((o) => ({
      ...o,
      date: o.date.toISOString(),
      createdAt: o.createdAt.toISOString(),
    })),
  }

  return <EventDetailClient event={serialized} isLive={isLive} qrDataUrl={qrDataUrl} />
}
