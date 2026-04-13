import MapViewLoader from '@/components/map/MapViewLoader'
import BottomNav from '@/components/layout/BottomNav'

export default function MapPage() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100 z-10 shrink-0">
        <span className="font-serif font-bold text-xl text-[#111111]">STRUT</span>
        <span className="text-xs text-gray-400">近くのコーデを発見</span>
      </header>

      <div className="flex-1 overflow-hidden">
        <MapViewLoader />
      </div>

      <BottomNav />
    </div>
  )
}
