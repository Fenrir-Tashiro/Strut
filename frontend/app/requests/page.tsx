'use client'

import { useState, useEffect } from 'react'
import BottomNav from '@/components/layout/BottomNav'

interface BrandRequest {
  id: string
  title: string
  description: string | null
  fee: number | null
  deadline: string | null
  status: string
  createdAt: string
  brand: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: '未対応', color: 'bg-yellow-100 text-yellow-700' },
  accepted: { label: '承認済み', color: 'bg-green-100 text-green-700' },
  declined: { label: '拒否', color: 'bg-gray-100 text-gray-500' },
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<BrandRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/requests')
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .finally(() => setIsLoading(false))
  }, [])

  const respond = async (id: string, status: 'accepted' | 'declined') => {
    setUpdating(id)
    const res = await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      )
    }
    setUpdating(null)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center">
        <h1 className="font-bold text-lg">着用依頼</h1>
      </header>

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#E8315B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📩</p>
            <p className="text-sm">着用依頼はありません</p>
          </div>
        ) : (
          requests.map((req) => {
            const s = STATUS_LABEL[req.status] ?? STATUS_LABEL.pending
            const isPending = req.status === 'pending'
            return (
              <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {req.brand.avatarUrl
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={req.brand.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : '🏷️'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{req.brand.displayName ?? req.brand.username}</p>
                      <p className="text-xs text-gray-400">@{req.brand.username}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${s.color}`}>{s.label}</span>
                </div>

                <div>
                  <p className="font-bold text-sm">{req.title}</p>
                  {req.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{req.description}</p>}
                </div>

                <div className="flex gap-3 text-xs text-gray-400">
                  {req.fee != null && (
                    <span className="font-bold text-[#E8315B]">報酬 ¥{req.fee.toLocaleString()}</span>
                  )}
                  {req.deadline && (
                    <span>期限 {new Date(req.deadline).toLocaleDateString('ja-JP')}</span>
                  )}
                </div>

                {isPending && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => respond(req.id, 'accepted')}
                      disabled={updating === req.id}
                      className="flex-1 bg-[#E8315B] text-white py-2 rounded-xl text-sm font-medium disabled:opacity-50"
                    >
                      承認する
                    </button>
                    <button
                      onClick={() => respond(req.id, 'declined')}
                      disabled={updating === req.id}
                      className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm disabled:opacity-50"
                    >
                      拒否する
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </main>

      <BottomNav />
    </div>
  )
}
