'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import type { UserRole } from '@/store/authStore'

const schema = z
  .object({
    username: z
      .string()
      .min(3, '3文字以上で入力してください')
      .max(30, '30文字以内で入力してください')
      .regex(/^[a-zA-Z0-9_]+$/, '英数字とアンダースコアのみ使用できます'),
    displayName: z.string().min(1, '表示名を入力してください').max(50),
    email: z.string().email('有効なメールアドレスを入力してください'),
    password: z.string().min(8, '8文字以上で入力してください'),
    confirmPassword: z.string(),
    roles: z.array(z.enum(['walker', 'searcher', 'brand'])).min(1, '1つ以上選択してください'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: 'walker', label: 'WALKER', desc: 'コーデを登録して収益を得る' },
  { value: 'searcher', label: 'SEARCHER', desc: '近くのコーデを発見・購入する' },
  { value: 'brand', label: 'BRAND', desc: 'WALKERに着用依頼を送る' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['searcher'])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { roles: ['searcher'] },
  })

  const toggleRole = (role: UserRole) => {
    const next = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role]
    setSelectedRoles(next)
    setValue('roles', next as [UserRole, ...UserRole[]])
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: data.username,
        displayName: data.displayName,
        email: data.email,
        password: data.password,
        roles: data.roles,
      }),
    })

    if (!res.ok) {
      const json = await res.json()
      setServerError(json.error ?? '登録に失敗しました')
      return
    }

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      setServerError('登録は完了しましたが、ログインに失敗しました')
      return
    }
    router.push('/map')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl font-bold text-white text-center mb-2">
          STRUT
        </h1>
        <p className="text-[#666666] text-center mb-8">新規登録</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              利用スタイルを選択（複数可）
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleRole(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedRoles.includes(opt.value)
                      ? 'border-[#E8315B] bg-[#E8315B]/10 text-white'
                      : 'border-white/20 bg-white/5 text-gray-400'
                  }`}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs opacity-70">{opt.desc}</div>
                </button>
              ))}
            </div>
            {errors.roles && (
              <p className="text-[#E8315B] text-xs mt-1">{errors.roles.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              ユーザー名（英数字・_）
            </label>
            <input
              {...register('username')}
              type="text"
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#E8315B] transition-colors"
              placeholder="my_username"
            />
            {errors.username && (
              <p className="text-[#E8315B] text-xs mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">表示名</label>
            <input
              {...register('displayName')}
              type="text"
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#E8315B] transition-colors"
              placeholder="山田 太郎"
            />
            {errors.displayName && (
              <p className="text-[#E8315B] text-xs mt-1">{errors.displayName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              メールアドレス
            </label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#E8315B] transition-colors"
              placeholder="example@email.com"
            />
            {errors.email && (
              <p className="text-[#E8315B] text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              パスワード（8文字以上）
            </label>
            <input
              {...register('password')}
              type="password"
              autoComplete="new-password"
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#E8315B] transition-colors"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-[#E8315B] text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              パスワード（確認）
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              autoComplete="new-password"
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#E8315B] transition-colors"
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="text-[#E8315B] text-xs mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-[#E8315B] text-sm text-center">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#E8315B] hover:bg-[#c9264e] disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? '登録中...' : '登録する'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/auth/login" className="text-[#E8315B] hover:underline">
            ログイン
          </Link>
        </p>
        <p className="text-center mt-4">
          <Link href="/" className="text-gray-500 text-xs hover:text-gray-300">
            トップに戻る
          </Link>
        </p>
      </div>
    </div>
  )
}
