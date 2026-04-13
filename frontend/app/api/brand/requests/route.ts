import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  walkerId: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  fee: z.number().int().nonnegative().optional(),
  deadline: z.string().optional(),
})

// 送信済み依頼一覧
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const requests = await prisma.brandRequest.findMany({
    where: { brandId: session.user.id },
    include: {
      walker: {
        select: { id: true, username: true, displayName: true, avatarUrl: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ requests })
}

// 着用依頼を作成
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roles: true },
  })
  if (!user?.roles.includes('brand')) {
    return NextResponse.json({ error: 'BRANDロールが必要です' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '入力内容に誤りがあります' }, { status: 400 })
  }

  const { walkerId, title, description, fee, deadline } = parsed.data

  const walker = await prisma.user.findUnique({ where: { id: walkerId } })
  if (!walker) {
    return NextResponse.json({ error: 'WALKERが見つかりません' }, { status: 404 })
  }

  const req = await prisma.brandRequest.create({
    data: {
      brandId: session.user.id,
      walkerId,
      title,
      description,
      fee,
      deadline: deadline ? new Date(deadline) : null,
    },
  })

  return NextResponse.json({ request: req }, { status: 201 })
}
