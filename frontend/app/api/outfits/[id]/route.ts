import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { id } = await params

  const outfit = await prisma.outfit.findUnique({
    where: { id },
    include: {
      walker: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          totalEarned: true,
        },
      },
      items: { orderBy: { sortOrder: 'asc' } },
      event: { select: { id: true, name: true } },
    },
  })

  if (!outfit) {
    return NextResponse.json({ error: 'コーデが見つかりません' }, { status: 404 })
  }

  return NextResponse.json({ outfit })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { id } = await params

  const outfit = await prisma.outfit.findUnique({
    where: { id },
    select: { walkerId: true },
  })
  if (!outfit) {
    return NextResponse.json({ error: 'コーデが見つかりません' }, { status: 404 })
  }
  if (outfit.walkerId !== session.user.id) {
    return NextResponse.json({ error: '編集権限がありません' }, { status: 403 })
  }

  const body = await request.json()
  const { items, ...outfitData } = body

  await prisma.$transaction(async (tx) => {
    await tx.outfit.update({
      where: { id },
      data: {
        title: outfitData.title ?? null,
        description: outfitData.description ?? null,
        imageUrl: outfitData.imageUrl ?? null,
        lat: outfitData.lat ?? null,
        lng: outfitData.lng ?? null,
        locationName: outfitData.locationName ?? null,
      },
    })

    if (Array.isArray(items)) {
      // 既存アイテムを削除して再作成
      await tx.outfitItem.deleteMany({ where: { outfitId: id } })
      if (items.length > 0) {
        await tx.outfitItem.createMany({
          data: items.map((item: Record<string, unknown>, i: number) => ({
            outfitId: id,
            category: item.category as string ?? null,
            brandName: item.brandName as string ?? null,
            itemName: item.itemName as string ?? null,
            price: item.price ? parseInt(String(item.price)) : null,
            buyUrl: (item.buyUrl as string) || null,
            imageUrl: item.imageUrl as string ?? null,
            sortOrder: i,
          })),
        })
      }
    }
  })

  const updated = await prisma.outfit.findUnique({
    where: { id },
    include: { items: { orderBy: { sortOrder: 'asc' } } },
  })

  return NextResponse.json({ outfit: updated })
}
