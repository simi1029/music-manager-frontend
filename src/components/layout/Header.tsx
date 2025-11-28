'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { UserMenu } from './UserMenu'

export function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
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
  
  const handleNavClick = () => {
    setIsMenuOpen(false)
  }
  
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/albums" className="text-xl font-semibold text-gray-900 hover:text-gray-700">
            🎵 Music Manager
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
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
            <UserMenu />
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t pt-4">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={handleNavClick}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="mt-2 px-4">
                <UserMenu />
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
