'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import BottomNav from '@/components/layout/BottomNav'

const CATEGORIES = [
  { value: 'top', label: 'トップス' },
  { value: 'bottom', label: 'ボトムス' },
  { value: 'shoes', label: 'シューズ' },
  { value: 'bag', label: 'バッグ' },
  { value: 'accessory', label: 'アクセサリー' },
]

const itemSchema = z.object({
  category: z.string().optional(),
  brandName: z.string().max(50).optional(),
  itemName: z.string().max(100).optional(),
  price: z.string().optional(),
  buyUrl: z.string().optional(),
  imageUrl: z.string().optional(),
})

const schema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(1000).optional(),
  locationName: z.string().max(100).optional(),
  items: z.array(itemSchema),
})

type FormData = z.infer<typeof schema>

export default function WalkerRegisterPage() {
  const router = useRouter()
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null)
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [uploadingMain, setUploadingMain] = useState(false)
  const [itemImagePreviews, setItemImagePreviews] = useState<Record<number, string>>({})
  const mainFileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { items: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  // 現在地の自動取得
  useEffect(() => {
    setLocationLoading(true)
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude)
        setLng(pos.coords.longitude)
        setLocationLoading(false)
      },
      () => setLocationLoading(false),
      { timeout: 8000 }
    )
  }, [])

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) return null
    const data = await res.json()
    return data.url
  }

  const handleMainImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMainImagePreview(URL.createObjectURL(file))
    setUploadingMain(true)
    const url = await uploadImage(file)
    setUploadingMain(false)
    if (url) setMainImageUrl(url)
  }

  const handleItemImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    setItemImagePreviews((prev) => ({
      ...prev,
      [index]: URL.createObjectURL(file),
    }))
    const url = await uploadImage(file)
    if (url) {
      // react-hook-form の setValue を使わずに直接DOMから取得するため
      // URLをstateで管理する
      setItemImagePreviews((prev) => ({ ...prev, [index]: url }))
    }
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null)

    const itemsWithImages = data.items.map((item, i) => ({
      category: item.category,
      brandName: item.brandName,
      itemName: item.itemName,
      price: item.price ? parseInt(item.price) : undefined,
      buyUrl: item.buyUrl,
      imageUrl: itemImagePreviews[i]?.startsWith('/uploads/') ? itemImagePreviews[i] : undefined,
      sortOrder: i,
    }))

    const res = await fetch('/api/outfits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        imageUrl: mainImageUrl,
        lat,
        lng,
        locationName: data.locationName,
        isActive: true,
        items: itemsWithImages,
      }),
    })

    if (!res.ok) {
      const json = await res.json()
      setServerError(json.error ?? '登録に失敗しました')
      return
    }

    router.push('/map')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center">
        <button onClick={() => router.back()} className="mr-3 text-gray-500 text-xl">
          ←
        </button>
        <h1 className="font-bold text-lg">今日のコーデを登録</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 pb-24">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

          {/* メイン写真 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold mb-3">コーデ写真</h2>
            <button
              type="button"
              onClick={() => mainFileRef.current?.click()}
              className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
                mainImagePreview ? 'border-transparent' : 'border-gray-200 hover:border-[#E8315B]'
              }`}
            >
              {mainImagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mainImagePreview}
                  alt="コーデ写真"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <>
                  <span className="text-3xl text-gray-300 mb-2">📷</span>
                  <span className="text-sm text-gray-400">タップして写真を追加</span>
                </>
              )}
              {uploadingMain && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                  <div className="w-6 h-6 border-2 border-[#E8315B] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={mainFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleMainImageChange}
            />
          </section>

          {/* 基本情報 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h2 className="font-bold">基本情報</h2>
            <div>
              <label className="block text-sm text-gray-500 mb-1">タイトル（任意）</label>
              <input
                {...register('title')}
                type="text"
                placeholder="例：今日のシンプルコーデ"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">コメント（任意）</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="コーデのポイントや気分など"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B] resize-none"
              />
            </div>
          </section>

          {/* 位置情報 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="font-bold">場所</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{locationLoading ? '取得中...' : lat && lng ? `📍 現在地を取得済み` : '📍 位置情報を取得できませんでした'}</span>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">場所名（任意）</label>
              <input
                {...register('locationName')}
                type="text"
                placeholder="例：渋谷、代官山など"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B]"
              />
            </div>
          </section>

          {/* アイテム */}
          <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">アイテム</h2>
              <span className="text-xs text-gray-400">{fields.length} 件</span>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="border border-gray-100 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">アイテム {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-gray-300 hover:text-red-400 text-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* アイテム画像 */}
                <label className="block cursor-pointer">
                  {itemImagePreviews[index] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={itemImagePreviews[index]}
                      alt="アイテム画像"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 text-2xl">
                      +
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleItemImageChange(e, index)}
                  />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">カテゴリ</label>
                    <select
                      {...register(`items.${index}.category`)}
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#E8315B]"
                    >
                      <option value="">選択</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ブランド名</label>
                    <input
                      {...register(`items.${index}.brandName`)}
                      type="text"
                      placeholder="UNIQLO"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#E8315B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">商品名</label>
                  <input
                    {...register(`items.${index}.itemName`)}
                    type="text"
                    placeholder="オーバーサイズシャツ"
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#E8315B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">価格（円）</label>
                    <input
                      {...register(`items.${index}.price`)}
                      type="number"
                      placeholder="2990"
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#E8315B]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">購入URL</label>
                    <input
                      {...register(`items.${index}.buyUrl`)}
                      type="url"
                      placeholder="https://..."
                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#E8315B]"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => append({ category: '', brandName: '', itemName: '', price: '', buyUrl: '' })}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-[#E8315B] hover:text-[#E8315B] transition-colors"
            >
              ＋ アイテムを追加
            </button>
          </section>

          {serverError && (
            <p className="text-[#E8315B] text-sm text-center bg-red-50 rounded-lg py-2 px-4">
              {serverError}
            </p>
          )}

          {errors.items && (
            <p className="text-[#E8315B] text-sm text-center">
              アイテムの入力内容を確認してください
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || uploadingMain}
            className="w-full bg-[#E8315B] hover:bg-[#c9264e] disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-base transition-colors shadow-md"
          >
            {isSubmitting ? '公開中...' : '今日のコーデとして公開する'}
          </button>
        </div>
      </form>

      <BottomNav />
    </div>
  )
}
