'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'

// Leafletデフォルトアイコン修正
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const walkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const currentLocationIcon = new L.DivIcon({
  html: `<div style="width:16px;height:16px;background:#E8315B;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: '',
})

interface OutfitPin {
  id: string
  title: string | null
  imageUrl: string | null
  lat: number
  lng: number
  walker: {
    id: string
    username: string
    displayName: string | null
    avatarUrl: string | null
  }
}

interface EventCircle {
  id: string
  name: string
  lat: number
  lng: number
  radiusM: number
}

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], 15)
  }, [map, lat, lng])
  return null
}

export default function MapView() {
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number } | null>(null)
  const [outfits, setOutfits] = useState<OutfitPin[]>([])
  const [events, setEvents] = useState<EventCircle[]>([])
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchNearby = async (lat: number, lng: number) => {
    try {
      const [outfitRes, eventRes] = await Promise.all([
        fetch(`/api/outfits/nearby?lat=${lat}&lng=${lng}&radius=2000`),
        fetch('/api/events/active'),
      ])
      if (outfitRes.ok) {
        const data = await outfitRes.json()
        setOutfits(data.outfits ?? [])
      }
      if (eventRes.ok) {
        const data = await eventRes.json()
        setEvents(
          (data.events ?? []).filter(
            (e: EventCircle) => e.lat != null && e.lng != null
          )
        )
      }
    } catch {
      // エラーは無視してpolling継続
    }
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('この端末はGPSに対応していません')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setCurrentPos({ lat, lng })
        setIsLoading(false)
        fetchNearby(lat, lng)

        // 30秒ごとにポーリング
        intervalRef.current = setInterval(() => fetchNearby(lat, lng), 30000)
      },
      () => {
        setLocationError('位置情報の取得に失敗しました。ブラウザの設定を確認してください。')
        setIsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F5F5]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#E8315B] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">現在地を取得中...</p>
        </div>
      </div>
    )
  }

  if (locationError || !currentPos) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F5F5] px-6">
        <div className="text-center max-w-sm">
          <p className="text-2xl mb-3">📍</p>
          <p className="text-gray-600 text-sm">{locationError ?? '位置情報を取得できませんでした'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 relative">
      <MapContainer
        center={[currentPos.lat, currentPos.lng]}
        zoom={15}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap lat={currentPos.lat} lng={currentPos.lng} />

        {/* 現在地 */}
        <Marker position={[currentPos.lat, currentPos.lng]} icon={currentLocationIcon} />

        {/* イベントエリア */}
        {events.map((ev) => (
          <Circle
            key={ev.id}
            center={[ev.lat, ev.lng]}
            radius={ev.radiusM}
            pathOptions={{ color: '#E8315B', fillColor: '#E8315B', fillOpacity: 0.1, weight: 2 }}
          />
        ))}

        {/* コーデピン */}
        {outfits.map((outfit) => (
          <Marker
            key={outfit.id}
            position={[outfit.lat, outfit.lng]}
            icon={walkerIcon}
          >
            <Popup minWidth={180}>
              <div className="text-sm">
                {outfit.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={outfit.imageUrl}
                    alt={outfit.title ?? 'コーデ'}
                    className="w-full h-28 object-cover rounded mb-2"
                  />
                )}
                <p className="font-bold truncate">
                  {outfit.title ?? '今日のコーデ'}
                </p>
                <p className="text-gray-500 text-xs mb-2">
                  @{outfit.walker.username}
                </p>
                <Link
                  href={`/outfit/${outfit.id}`}
                  className="block text-center bg-[#E8315B] text-white text-xs py-1.5 rounded-full"
                >
                  詳細を見る
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* コーデ数バッジ */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur rounded-full px-4 py-1.5 shadow text-sm font-medium text-gray-700 pointer-events-none">
        {outfits.length > 0
          ? `近くに ${outfits.length} 件のコーデ`
          : '近くにコーデはありません'}
      </div>
    </div>
  )
}
