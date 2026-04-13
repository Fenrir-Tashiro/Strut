'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import BottomNav from '@/components/layout/BottomNav'

const schema = z.object({
  title: z.string().min(1, '件名を入力してください').max(100),
  description: z.string().max(1000).optional(),
  fee: z.string().optional(),
  deadline: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface Walker {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  totalEarned: number
  _count: { outfits: number }
}

export default function BrandRequestNewPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [walkers, setWalkers] = useState<Walker[]>([])
  const [selectedWalker, setSelectedWalker] = useState<Walker | null>(null)
  const [searching, setSearching] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const searchWalkers = async () => {
    if (!query.trim()) return
    setSearching(true)
    const res = await fetch(`/api/walkers/search?q=${encodeURIComponent(query)}`)
    if (res.ok) {
      const data = await res.json()
      setWalkers(data.walkers)
    }
    setSearching(false)
  }

  const onSubmit = async (data: FormData) => {
    if (!selectedWalker) {
      setServerError('WALKERを選択してください')
      return
    }
    setServerError(null)
    const res = await fetch('/api/brand/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walkerId: selectedWalker.id,
        title: data.title,
        description: data.description,
        fee: data.fee ? parseInt(data.fee) : undefined,
        deadline: data.deadline || undefined,
      }),
    })
    if (!res.ok) {
      const json = await res.json()
      setServerError(json.error ?? '送信に失敗しました')
      return
    }
    router.push('/brand/dashboard')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center">
        <button onClick={() => router.back()} className="mr-3 text-gray-500 text-xl">←</button>
        <h1 className="font-bold text-lg">着用依頼を送る</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 pb-24">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

          {/* WALKER検索 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="font-bold">WALKERを選択</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchWalkers())}
                placeholder="ユーザー名・表示名で検索"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B]"
              />
              <button
                type="button"
                onClick={searchWalkers}
                disabled={searching}
                className="bg-[#111111] text-white px-4 py-2 rounded-lg text-sm shrink-0 disabled:opacity-50"
              >
                {searching ? '...' : '検索'}
              </button>
            </div>

            {selectedWalker && (
              <div className="flex items-center gap-3 bg-[#E8315B]/10 border border-[#E8315B]/30 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg shrink-0 overflow-hidden">
                  {selectedWalker.avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={selectedWalker.avatarUrl} alt="" className="w-full h-full object-cover" />
                    : '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{selectedWalker.displayName ?? selectedWalker.username}</p>
                  <p className="text-xs text-gray-500">@{selectedWalker.username} · {selectedWalker._count.outfits} コーデ</p>
                </div>
                <button type="button" onClick={() => setSelectedWalker(null)} className="text-gray-400 text-lg">✕</button>
              </div>
            )}

            {walkers.length > 0 && !selectedWalker && (
              <div className="space-y-2">
                {walkers.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => { setSelectedWalker(w); setWalkers([]) }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left border border-gray-100"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                      {w.avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={w.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{w.displayName ?? w.username}</p>
                      <p className="text-xs text-gray-500">@{w.username} · {w._count.outfits} コーデ · {w.totalEarned} pt</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 依頼内容 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h2 className="font-bold">依頼内容</h2>
            <div>
              <label className="block text-sm text-gray-500 mb-1">件名 <span className="text-[#E8315B]">*</span></label>
              <input
                {...register('title')}
                type="text"
                placeholder="例：春夏新作ジャケットの着用依頼"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B]"
              />
              {errors.title && <p className="text-[#E8315B] text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">詳細</label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="依頼の詳細・条件などを記載してください"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1">報酬額（円）</label>
                <input
                  {...register('fee')}
                  type="number"
                  placeholder="10000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">期限</label>
                <input
                  {...register('deadline')}
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B]"
                />
              </div>
            </div>
          </section>

          {serverError && (
            <p className="text-[#E8315B] text-sm text-center bg-red-50 rounded-lg py-2 px-4">{serverError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !selectedWalker}
            className="w-full bg-[#E8315B] hover:bg-[#c9264e] disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-base transition-colors shadow-md"
          >
            {isSubmitting ? '送信中...' : '依頼を送信する'}
          </button>
        </div>
      </form>

      <BottomNav />
    </div>
  )
}
