import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const itemSchema = z.object({
  category: z.string().optional(),
  brandName: z.string().optional(),
  itemName: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
  buyUrl: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().optional(),
  sortOrder: z.number().int().default(0),
})

const outfitSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  locationName: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  items: z.array(itemSchema).max(20).default([]),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  // WALKERロール確認
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  })
  if (!user?.roles.includes('walker')) {
    return NextResponse.json({ error: 'WALKERのみコーデを投稿できます' }, { status: 403 })
  }

  // 1日1コーデバリデーション
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const existing = await prisma.outfit.findFirst({
    where: {
      walkerId: session.user.id,
      createdAt: { gte: today, lt: tomorrow },
    },
  })
  if (existing) {
    return NextResponse.json(
      { error: '1日に登録できるコーデは1件までです' },
      { status: 409 }
    )
  }

  const body = await request.json()
  const parsed = outfitSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '入力内容に誤りがあります' }, { status: 400 })
  }

  const { items, ...outfitData } = parsed.data

  const outfit = await prisma.outfit.create({
    data: {
      ...outfitData,
      walkerId: session.user.id,
      items: {
        create: items.map((item, i) => ({
          ...item,
          buyUrl: item.buyUrl || null,
          sortOrder: i,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json({ outfit }, { status: 201 })
}
