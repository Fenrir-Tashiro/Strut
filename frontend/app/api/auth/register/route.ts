import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  roles: z.array(z.enum(['walker', 'searcher', 'brand'])).min(1),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: '入力内容に誤りがあります' },
        { status: 400 }
      )
    }

    const { username, displayName, email, password, roles } = parsed.data

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (existing) {
      const field = existing.email === email ? 'メールアドレス' : 'ユーザー名'
      return NextResponse.json(
        { error: `その${field}はすでに使用されています` },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: {
        username,
        displayName,
        email,
        passwordHash,
        roles: roles.join(','),
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 })
  }
}
