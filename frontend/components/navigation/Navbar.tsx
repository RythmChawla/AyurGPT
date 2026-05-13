'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

export function Navbar() {
  const { isAuthenticated, user, hasHydrated, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    apiClient.logout()
    logout()
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              🌿 AyurGPT
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/chat" className="text-gray-700 hover:text-emerald-600 transition-colors">
              Chat
            </Link>
            <Link href="/dosha" className="text-gray-700 hover:text-emerald-600 transition-colors">
              Dosha Quiz
            </Link>
            <Link href="/herbs" className="text-gray-700 hover:text-emerald-600 transition-colors">
              Herbs
            </Link>
            <Link href="/symptoms" className="text-gray-700 hover:text-emerald-600 transition-colors">
              Symptoms
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-4">
            {hasHydrated && isAuthenticated ? (
              <>
                <Link href="/dashboard" className="text-sm text-gray-700 hover:text-emerald-600">
                  {user?.full_name || user?.username}
                </Link>
                <Link href="/profile" className="btn-secondary !px-4 !py-2 !text-sm">
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-primary !px-4 !py-2 !text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-700 hover:text-emerald-600">
                  Login
                </Link>
                <Link href="/register" className="btn-primary !px-4 !py-2 !text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
