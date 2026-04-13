'use client'

import { useState, useRef } from 'react'
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
  description: string | null
  imageUrl: string | null
  lat: number | null
  lng: number | null
  locationName: string | null
  items: OutfitItem[]
}

export default function WalkerEditClient({ outfit }: { outfit: Outfit }) {
  const router = useRouter()
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(outfit.imageUrl)
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(outfit.imageUrl)
  const [uploadingMain, setUploadingMain] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [itemImagePreviews, setItemImagePreviews] = useState<Record<number, string>>(
    Object.fromEntries(
      outfit.items
        .map((item, i) => (item.imageUrl ? [i, item.imageUrl] : null))
        .filter(Boolean) as [number, string][]
    )
  )
  const mainFileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: outfit.title ?? '',
      description: outfit.description ?? '',
      locationName: outfit.locationName ?? '',
      items: outfit.items.map((item) => ({
        category: item.category ?? '',
        brandName: item.brandName ?? '',
        itemName: item.itemName ?? '',
        price: item.price != null ? String(item.price) : '',
        buyUrl: item.buyUrl ?? '',
        imageUrl: item.imageUrl ?? '',
      })),
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const uploadImage = async (file: File): Promise<string | null> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!res.ok) return null
    return (await res.json()).url
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
    setItemImagePreviews((prev) => ({ ...prev, [index]: URL.createObjectURL(file) }))
    const url = await uploadImage(file)
    if (url) setItemImagePreviews((prev) => ({ ...prev, [index]: url }))
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null)

    const res = await fetch(`/api/outfits/${outfit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        imageUrl: mainImageUrl,
        lat: outfit.lat,
        lng: outfit.lng,
        locationName: data.locationName,
        items: data.items.map((item, i) => ({
          category: item.category,
          brandName: item.brandName,
          itemName: item.itemName,
          price: item.price,
          buyUrl: item.buyUrl,
          imageUrl: itemImagePreviews[i] ?? item.imageUrl,
          sortOrder: i,
        })),
      }),
    })

    if (!res.ok) {
      const json = await res.json()
      setServerError(json.error ?? '更新に失敗しました')
      return
    }

    router.push('/walker/history')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F5]">
      <header className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 h-14 flex items-center">
        <button onClick={() => router.back()} className="mr-3 text-gray-500 text-xl">←</button>
        <h1 className="font-bold text-lg">コーデを編集</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 pb-24">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

          {/* メイン写真 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold mb-3">コーデ写真</h2>
            <div className="relative">
              <button
                type="button"
                onClick={() => mainFileRef.current?.click()}
                className={`w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors overflow-hidden ${
                  mainImagePreview ? 'border-transparent' : 'border-gray-200 hover:border-[#E8315B]'
                }`}
              >
                {mainImagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mainImagePreview} alt="コーデ写真" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="text-3xl text-gray-300 mb-2">📷</span>
                    <span className="text-sm text-gray-400">タップして写真を変更</span>
                  </>
                )}
              </button>
              {uploadingMain && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                  <div className="w-6 h-6 border-2 border-[#E8315B] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input ref={mainFileRef} type="file" accept="image/*" className="hidden" onChange={handleMainImageChange} />
          </section>

          {/* 基本情報 */}
          <section className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
            <h2 className="font-bold">基本情報</h2>
            <div>
              <label className="block text-sm text-gray-500 mb-1">タイトル（任意）</label>
              <input
                {...register('title')}
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B]"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">コメント（任意）</label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8315B] resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">場所名（任意）</label>
              <input
                {...register('locationName')}
                type="text"
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
                  <button type="button" onClick={() => remove(index)} className="text-gray-300 hover:text-red-400 text-lg">✕</button>
                </div>

                <label className="block cursor-pointer">
                  {itemImagePreviews[index] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={itemImagePreviews[index]} alt="アイテム画像" className="w-20 h-20 object-cover rounded-lg" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 text-2xl">+</div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleItemImageChange(e, index)} />
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">カテゴリ</label>
                    <select {...register(`items.${index}.category`)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#E8315B]">
                      <option value="">選択</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ブランド名</label>
                    <input {...register(`items.${index}.brandName`)} type="text" placeholder="UNIQLO" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#E8315B]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">商品名</label>
                  <input {...register(`items.${index}.itemName`)} type="text" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#E8315B]" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">価格（円）</label>
                    <input {...register(`items.${index}.price`)} type="number" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#E8315B]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">購入URL</label>
                    <input {...register(`items.${index}.buyUrl`)} type="url" placeholder="https://..." className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#E8315B]" />
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
            <p className="text-[#E8315B] text-sm text-center bg-red-50 rounded-lg py-2 px-4">{serverError}</p>
          )}
          {errors.items && (
            <p className="text-[#E8315B] text-sm text-center">アイテムの入力内容を確認してください</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || uploadingMain}
            className="w-full bg-[#E8315B] hover:bg-[#c9264e] disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-base transition-colors shadow-md"
          >
            {isSubmitting ? '保存中...' : '変更を保存する'}
          </button>
        </div>
      </form>

      <BottomNav />
    </div>
  )
}
