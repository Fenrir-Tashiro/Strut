'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface OutfitItem {
  id: string
  category: string | null
  brandName: string | null
  itemName: string | null
  price: number | null
  buyUrl: string | null
  imageUrl: string | null
}

interface Walker {
  id: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
}

interface Outfit {
  id: string
  title: string | null
  description: string | null
  imageUrl: string | null
  locationName: string | null
  viewCount: number
  createdAt: string
  walker: Walker
  items: OutfitItem[]
}

const CATEGORY_LABELS: Record<string, string> = {
  top: 'トップス',
  bottom: 'ボトムス',
  shoes: 'シューズ',
  bag: 'バッグ',
  accessory: 'アクセサリー',
}

export default function OutfitDetailClient({ outfit }: { outfit: Outfit }) {
  // 閲覧ログ（マウント時に1回）
  useEffect(() => {
    fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfitId: outfit.id, type: 'view' }),
    }).catch(() => {})
  }, [outfit.id])

  const handleItemClick = (itemId: string, buyUrl: string) => {
    fetch('/api/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outfitId: outfit.id, itemId, type: 'click' }),
    }).catch(() => {})
    window.open(buyUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      {/* ヘッダー */}
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center">
        <Link href="/map" className="mr-3 text-gray-500 text-xl">←</Link>
        <h1 className="font-bold text-base truncate">
          {outfit.title ?? '今日のコーデ'}
        </h1>
      </header>

      <main className="flex-1 pb-8 max-w-lg mx-auto w-full">
        {/* メイン画像 */}
        {outfit.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={outfit.imageUrl}
            alt={outfit.title ?? 'コーデ'}
            className="w-full aspect-[3/4] object-cover"
          />
        ) : (
          <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center text-6xl text-gray-300">
            👗
          </div>
        )}

        <div className="px-4 py-4 space-y-4">
          {/* WALKERプロフィール */}
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
            {outfit.walker.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={outfit.walker.avatarUrl}
                alt={outfit.walker.displayName ?? outfit.walker.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl">
                👤
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">
                {outfit.walker.displayName ?? outfit.walker.username}
              </p>
              <p className="text-sm text-gray-400">@{outfit.walker.username}</p>
              {outfit.walker.bio && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{outfit.walker.bio}</p>
              )}
            </div>
            <Link
              href={`/profile/${outfit.walker.username}`}
              className="text-xs border border-gray-200 rounded-full px-3 py-1 text-gray-600 shrink-0"
            >
              プロフィール
            </Link>
          </div>

          {/* コーデ情報 */}
          {(outfit.description || outfit.locationName) && (
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              {outfit.locationName && (
                <p className="text-sm text-gray-500">📍 {outfit.locationName}</p>
              )}
              {outfit.description && (
                <p className="text-sm text-gray-700 leading-relaxed">{outfit.description}</p>
              )}
              <p className="text-xs text-gray-400">
                {new Date(outfit.createdAt).toLocaleDateString('ja-JP')} · 👁 {outfit.viewCount}
              </p>
            </div>
          )}

          {/* アイテムリスト */}
          {outfit.items.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-bold text-base px-1">アイテム</h2>
              {outfit.items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex gap-3">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.itemName ?? 'アイテム'}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl text-gray-300 shrink-0">
                      👕
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {item.category && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[item.category] ?? item.category}
                      </span>
                    )}
                    {item.brandName && (
                      <p className="text-xs text-gray-400 mt-1">{item.brandName}</p>
                    )}
                    <p className="font-medium text-sm truncate mt-0.5">
                      {item.itemName ?? 'アイテム名未記入'}
                    </p>
                    {item.price != null && (
                      <p className="text-[#E8315B] font-bold text-sm mt-0.5">
                        ¥{item.price.toLocaleString()}
                      </p>
                    )}
                  </div>
                  {item.buyUrl && (
                    <button
                      onClick={() => handleItemClick(item.id, item.buyUrl!)}
                      className="shrink-0 self-center bg-[#111111] hover:bg-[#333] text-white text-xs px-3 py-2 rounded-xl transition-colors"
                    >
                      購入サイトへ
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
