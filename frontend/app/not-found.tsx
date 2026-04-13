import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl mb-4">👗</p>
      <h1 className="font-serif text-3xl font-bold text-[#111111] mb-2">404</h1>
      <p className="text-gray-500 text-sm mb-8">ページが見つかりません</p>
      <Link href="/map" className="bg-[#E8315B] text-white px-6 py-3 rounded-full text-sm font-medium">
        マップに戻る
      </Link>
    </div>
  )
}
