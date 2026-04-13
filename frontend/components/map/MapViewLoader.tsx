'use client'

import dynamic from 'next/dynamic'

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-[#F5F5F5]">
      <div className="w-8 h-8 border-2 border-[#E8315B] border-t-transparent rounded-full animate-spin" />
    </div>
  ),
})

export default function MapViewLoader() {
  return <MapView />
}
