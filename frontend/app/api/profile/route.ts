import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().optional(),
  roles: z.array(z.enum(['walker', 'searcher', 'brand'])).min(1).optional(),
})

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: '入力内容に誤りがあります' }, { status: 400 })
  }

  const { roles, ...rest } = parsed.data
  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...rest,
      ...(roles ? { roles: roles.join(',') } : {}),
    },
    select: {
      id: true, username: true, displayName: true,
      avatarUrl: true, bio: true, roles: true,
    },
  })

  return NextResponse.json({ user: updated })
}
