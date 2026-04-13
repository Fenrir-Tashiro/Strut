'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'

const schema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    if (result?.error) {
      setServerError('メールアドレスまたはパスワードが正しくありません')
      return
    }
    router.push('/map')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl font-bold text-white text-center mb-2">
          STRUT
        </h1>
        <p className="text-[#666666] text-center mb-8">ログイン</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <label className="block text-sm text-gray-300 mb-1">パスワード</label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#E8315B] transition-colors"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-[#E8315B] text-xs mt-1">{errors.password.message}</p>
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
            {isSubmitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          アカウントをお持ちでない方は{' '}
          <Link href="/auth/register" className="text-[#E8315B] hover:underline">
            新規登録
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
