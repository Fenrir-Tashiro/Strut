'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore, type UserRole } from '@/store/authStore'
import BottomNav from '@/components/layout/BottomNav'
import Link from 'next/link'

const schema = z.object({
  displayName: z.string().min(1, '表示名を入力してください').max(50),
  bio: z.string().max(300).optional(),
})
type FormData = z.infer<typeof schema>

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: 'walker', label: 'WALKER', desc: 'コーデを登録して収益を得る' },
  { value: 'searcher', label: 'SEARCHER', desc: '近くのコーデを発見・購入する' },
  { value: 'brand', label: 'BRAND', desc: 'WALKERに着用依頼を送る' },
]

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, update } = useSession()
  const user = useAuthStore((s) => s.user)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const currentRoles = user?.roles?.split(',').filter(Boolean) as UserRole[] ?? []

  useEffect(() => {
    if (currentRoles.length > 0 && selectedRoles.length === 0) {
      setSelectedRoles(currentRoles)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: session?.user?.name ?? '',
      bio: '',
    },
  })

  const toggleRole = (role: UserRole) => {
    const next = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role]
    if (next.length === 0) return
    setSelectedRoles(next)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    setUploadingAvatar(false)
    if (res.ok) {
      const data = await res.json()
      setAvatarUrl(data.url)
    }
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: data.displayName,
        bio: data.bio,
        roles: selectedRoles,
        ...(avatarUrl ? { avatarUrl } : {}),
      }),
    })
    if (!res.ok) {
      const json = await res.json()
      setServerError(json.error ?? '更新に失敗しました')
      return
    }
    await update()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/map" className="text-gray-500 text-xl">←</Link>
          <h1 className="font-bold text-lg">設定</h1>
        </div>
        {saved && <span className="text-green-500 text-sm font-medium">保存しました ✓</span>}
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 pb-24">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

          {/* アバター */}
          <section className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                {avatarPreview
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={avatarPreview} alt="アバター" className="w-full h-full object-cover" />
                  : user?.name
                    ? <span className="flex items-center justify-center w-full h-full text-4xl">👤</span>
                    : <span className="flex items-center justify-center w-full h-full text-4xl">👤</span>}
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#E8315B] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm text-[#E8315B] font-medium"
            >
              写真を変更
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </section>

          {/* 基本情報 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h2 className="font-bold">プロフィール</h2>
            <div>
              <label className="block text-sm text-gray-500 mb-1">表示名</label>
              <input
                {...register('displayName')}
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B]"
              />
              {errors.displayName && <p className="text-[#E8315B] text-xs mt-1">{errors.displayName.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">自己紹介（300文字以内）</label>
              <textarea
                {...register('bio')}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B] resize-none"
                placeholder="自己紹介を入力してください"
              />
            </div>
          </section>

          {/* ロール */}
          <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="font-bold">利用スタイル</h2>
            {ROLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleRole(opt.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  selectedRoles.includes(opt.value)
                    ? 'border-[#E8315B] bg-[#E8315B]/5'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.desc}</div>
              </button>
            ))}
          </section>

          {serverError && (
            <p className="text-[#E8315B] text-sm text-center bg-red-50 rounded-lg py-2 px-4">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || uploadingAvatar}
            className="w-full bg-[#E8315B] hover:bg-[#c9264e] disabled:opacity-50 text-white py-4 rounded-2xl font-bold transition-colors shadow-md"
          >
            {isSubmitting ? '保存中...' : '変更を保存'}
          </button>

          {/* ログアウト */}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full border border-gray-200 text-gray-600 py-4 rounded-2xl font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            ログアウト
          </button>

          <p className="text-center text-xs text-gray-400">STRUT v0.1.0 — MVP</p>
        </div>
      </form>

      <BottomNav />
    </div>
  )
}
