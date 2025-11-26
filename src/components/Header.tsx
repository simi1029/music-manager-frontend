'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Header() {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    if (path === '/albums') {
      return pathname === '/albums' || pathname.startsWith('/album/')
    }
    if (path === '/artists') {
      return pathname === '/artists' || pathname.startsWith('/artist/')
    }
    return pathname === path
  }
  
  const navItems = [
    { name: 'Albums', path: '/albums' },
    { name: 'Artists', path: '/artists' },
    { name: 'Import', path: '/import' },
  ]
  
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/albums" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
            🎵 Music Manager
          </Link>
          <nav className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
