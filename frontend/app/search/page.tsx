'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'
import { useDebounce } from '@/lib/hooks/useDebounce'

const CATEGORIES = [
  { value: '', label: 'すべて' },
  { value: 'top', label: 'トップス' },
  { value: 'bottom', label: 'ボトムス' },
  { value: 'shoes', label: 'シューズ' },
  { value: 'bag', label: 'バッグ' },
  { value: 'accessory', label: 'アクセサリー' },
]

interface Outfit {
  id: string
  title: string | null
  imageUrl: string | null
  viewCount: number
  walker: { username: string; displayName: string | null; avatarUrl: string | null }
  items: { brandName: string | null; itemName: string | null }[]
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    const search = async () => {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (debouncedQuery) params.set('q', debouncedQuery)
      if (category) params.set('category', category)
      const res = await fetch(`/api/outfits/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOutfits(data.outfits ?? [])
      }
      setIsLoading(false)
    }
    search()
  }, [debouncedQuery, category])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center gap-2">
          <Link href="/map" className="text-gray-500 text-xl shrink-0">←</Link>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="コーデ・ブランド・WALKERで検索"
              className="w-full bg-gray-100 rounded-full pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8315B]/30"
            />
          </div>
        </div>

        {/* カテゴリフィルター */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                category === c.value
                  ? 'bg-[#E8315B] border-[#E8315B] text-white'
                  : 'border-gray-200 text-gray-500 bg-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 pb-24 px-4 py-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="aspect-[3/4] bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : outfits.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">
              {query || category ? '該当するコーデが見つかりません' : 'キーワードを入力して検索'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3">{outfits.length} 件</p>
            <div className="grid grid-cols-2 gap-3">
              {outfits.map((outfit) => (
                <Link
                  key={outfit.id}
                  href={`/outfit/${outfit.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="aspect-[3/4] bg-gray-100">
                    {outfit.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={outfit.imageUrl} alt={outfit.title ?? 'コーデ'} className="w-full h-full object-cover" />
                      : <span className="flex items-center justify-center w-full h-full text-4xl">👗</span>}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{outfit.title ?? '今日のコーデ'}</p>
                    <p className="text-xs text-gray-400 truncate">@{outfit.walker.username}</p>
                    {outfit.items[0] && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {outfit.items[0].brandName ?? outfit.items[0].itemName}
                      </p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">👁 {outfit.viewCount}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
