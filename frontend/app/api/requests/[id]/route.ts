import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['accepted', 'declined']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '入力が不正です' }, { status: 400 })
  }

  const req = await prisma.brandRequest.findUnique({ where: { id } })
  if (!req) {
    return NextResponse.json({ error: '依頼が見つかりません' }, { status: 404 })
  }
  if (req.walkerId !== session.user.id) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const updated = await prisma.brandRequest.update({
    where: { id },
    data: { status: parsed.data.status },
  })

  return NextResponse.json({ request: updated })
}
