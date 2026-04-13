'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

const navItems = [
  { href: '/map', label: 'マップ', icon: '🗺️' },
  { href: '/walker/register', label: '投稿', icon: '➕', role: 'walker' as const },
  { href: '/walker/dashboard', label: '収益', icon: '💰', role: 'walker' as const },
  { href: '/requests', label: '依頼', icon: '📩', role: 'walker' as const },
  { href: '/settings', label: '設定', icon: '⚙️' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const hasRole = useAuthStore((s) => s.hasRole)

  const visible = navItems.filter((item) => !item.role || hasRole(item.role))

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {visible.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive ? 'text-[#E8315B]' : 'text-gray-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
