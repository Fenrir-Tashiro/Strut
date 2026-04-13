import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// 2点間の距離をメートルで返す（Haversine公式）
function getDistanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const radius = parseInt(searchParams.get('radius') ?? '2000')

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json({ error: '位置情報が不正です' }, { status: 400 })
  }

  // 概算のバウンディングボックスでDBフィルタ（約1度 = 111km）
  const deltaLat = radius / 111000
  const deltaLng = radius / (111000 * Math.cos((lat * Math.PI) / 180))

  const outfits = await prisma.outfit.findMany({
    where: {
      isActive: true,
      lat: { gte: lat - deltaLat, lte: lat + deltaLat },
      lng: { gte: lng - deltaLng, lte: lng + deltaLng },
    },
    include: {
      walker: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
      items: { orderBy: { sortOrder: 'asc' }, take: 1 },
      event: { select: { id: true, name: true, isActive: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // 精密な距離フィルタ
  const nearby = outfits.filter((o) => {
    if (o.lat == null || o.lng == null) return false
    return getDistanceM(lat, lng, o.lat, o.lng) <= radius
  })

  return NextResponse.json({ outfits: nearby })
}
