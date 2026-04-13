'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const CATEGORY_LABELS: Record<string, string> = {
  top: 'トップス', bottom: 'ボトムス', shoes: 'シューズ',
  bag: 'バッグ', accessory: 'アクセサリー',
}

interface OutfitItem {
  id: string
  category: string | null
  brandName: string | null
  itemName: string | null
  price: number | null
  buyUrl: string | null
  imageUrl: string | null
}

interface Outfit {
  id: string
  title: string | null
  imageUrl: string | null
  walker: { id: string; username: string; displayName: string | null; avatarUrl: string | null }
  items: OutfitItem[]
}

interface Event {
  id: string
  name: string
  description: string | null
  venueName: string | null
  startAt: string | null
  endAt: string | null
  isActive: boolean
  qrCode: string | null
  outfits: Outfit[]
}

const handleBuyClick = (outfitId: string, itemId: string, buyUrl: string) => {
  fetch('/api/interactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outfitId, itemId, type: 'click' }),
  }).catch(() => {})
  window.open(buyUrl, '_blank', 'noopener,noreferrer')
}

export default function EventDetailClient({
  event,
  isLive,
  qrDataUrl,
}: {
  event: Event
  isLive: boolean
  qrDataUrl: string | null
}) {
  const [expandedOutfit, setExpandedOutfit] = useState<string | null>(null)

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center gap-3">
        <Link href="/events" className="text-gray-500 text-xl">←</Link>
        <h1 className="font-bold text-base truncate flex-1">{event.name}</h1>
        {isLive && (
          <span className="text-xs bg-[#E8315B] text-white px-2 py-1 rounded-full animate-pulse shrink-0">
            イベント中
          </span>
        )}
      </header>

      <main className="flex-1 pb-8 max-w-lg mx-auto w-full">
        {/* イベント情報 */}
        <div className="px-4 py-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            {event.venueName && <p className="text-sm text-gray-600">📍 {event.venueName}</p>}
            {event.description && <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>}
            {(event.startAt || event.endAt) && (
              <p className="text-xs text-gray-400">
                {event.startAt && new Date(event.startAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {event.endAt && ` 〜 ${new Date(event.endAt).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
              </p>
            )}
          </div>

          {/* QRコード */}
          {qrDataUrl && (
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <p className="text-sm font-medium mb-3 text-gray-600">このイベントのQRコード</p>
              <Image src={qrDataUrl} alt="QRコード" width={160} height={160} className="mx-auto" />
              <p className="text-xs text-gray-400 mt-2">スキャンするとイベントページが開きます</p>
            </div>
          )}

          {/* コーデ一覧 */}
          <h2 className="font-bold text-base px-1">出演者のコーデ（{event.outfits.length}）</h2>

          {event.outfits.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-400 text-sm shadow-sm">
              まだコーデが登録されていません
            </div>
          ) : (
            event.outfits.map((outfit) => {
              const isExpanded = expandedOutfit === outfit.id
              return (
                <div key={outfit.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* WALKERヘッダー */}
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left"
                    onClick={() => setExpandedOutfit(isExpanded ? null : outfit.id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0">
                      {outfit.walker.avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={outfit.walker.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="flex items-center justify-center w-full h-full text-lg">👤</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm">{outfit.walker.displayName ?? outfit.walker.username}</p>
                      <p className="text-xs text-gray-400">{outfit.title ?? '今日のコーデ'}</p>
                    </div>
                    {outfit.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={outfit.imageUrl} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    )}
                    <span className="text-gray-400 text-sm ml-1">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {/* アイテム一覧（展開時） */}
                  {isExpanded && outfit.items.length > 0 && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {outfit.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                            {item.imageUrl
                              // eslint-disable-next-line @next/next/no-img-element
                              ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                              : <span className="flex items-center justify-center w-full h-full text-xl">👕</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            {item.category && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                {CATEGORY_LABELS[item.category] ?? item.category}
                              </span>
                            )}
                            <p className="text-sm font-medium truncate mt-0.5">{item.itemName ?? '名称未記入'}</p>
                            {item.brandName && <p className="text-xs text-gray-400">{item.brandName}</p>}
                            {item.price != null && (
                              <p className="text-[#E8315B] font-bold text-sm">¥{item.price.toLocaleString()}</p>
                            )}
                          </div>
                          {item.buyUrl && (
                            <button
                              onClick={() => handleBuyClick(outfit.id, item.id, item.buyUrl!)}
                              className="shrink-0 bg-[#E8315B] text-white text-xs px-3 py-2 rounded-xl"
                            >
                              即購入
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
