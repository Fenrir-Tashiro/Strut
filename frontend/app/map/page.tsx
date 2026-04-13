import MapViewLoader from '@/components/map/MapViewLoader'
import BottomNav from '@/components/layout/BottomNav'
import Link from 'next/link'

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 z-10 shrink-0">
        <span className="font-serif font-bold text-xl text-[#111111]">STRUT</span>
        <Link href="/search" className="flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-500">
          <span>🔍</span>
          <span>検索</span>
        </Link>
      </header>

      <div className="flex-1 overflow-hidden">
        <MapViewLoader />
      </div>

      <BottomNav />
    </div>
  )
}
