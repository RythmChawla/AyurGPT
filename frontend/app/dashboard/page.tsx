'use client'

import React, { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ChatHistory, DoshaProfile, User } from '@/types'

interface DashboardData {
  user?: User
  dosha_profile?: DoshaProfile
  recent_chats?: ChatHistory[]
}

export default function DashboardPage() {
  const { isAuthenticated, user, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const fetchDashboard = async () => {
      try {
        const data = await apiClient.getDashboard()
        setDashboard(data)
      } catch (error) {
        console.error('Error fetching dashboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated || !isAuthenticated) {
    return null
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            Welcome, {user?.full_name || user?.username || dashboard?.user?.full_name || dashboard?.user?.username || 'there'}!
          </h1>
          <p className="text-gray-600">Your personalized Ayurvedic wellness dashboard</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dosha Card */}
          {dashboard?.dosha_profile && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-wellness lg:col-span-2"
            >
              <h2 className="text-2xl font-bold mb-4">Your Dosha Profile</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { dosha: 'Vata', score: dashboard.dosha_profile.vata_score, color: 'bg-blue-100' },
                  { dosha: 'Pitta', score: dashboard.dosha_profile.pitta_score, color: 'bg-red-100' },
                  { dosha: 'Kapha', score: dashboard.dosha_profile.kapha_score, color: 'bg-green-100' },
                ].map(item => (
                  <div key={item.dosha} className={`${item.color} p-4 rounded-lg text-center`}>
                    <p className="font-semibold">{item.dosha}</p>
                    <p className="text-2xl font-bold">{item.score.toFixed(0)}%</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-700">{dashboard.dosha_profile.dosha_description}</p>
            </motion.div>
          )}

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-wellness"
          >
            <h2 className="text-xl font-bold mb-4">Quick Links</h2>
            <div className="space-y-2">
              <Link href="/chat" className="block btn-primary text-center">
                💬 Ask AI
              </Link>
              <Link href="/dosha" className="block btn-secondary text-center">
                📊 Retake Quiz
              </Link>
              <Link href="/herbs" className="block btn-secondary text-center">
                🌿 Herbs
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Recent Chats */}
        {dashboard?.recent_chats && dashboard.recent_chats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 card-wellness"
          >
            <h2 className="text-2xl font-bold mb-4">Recent Conversations</h2>
            <div className="space-y-3">
              {dashboard.recent_chats.slice(0, 5).map((chat) => (
                <div key={chat.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <p className="font-semibold">{chat.title || 'Untitled Chat'}</p>
                  <p className="text-sm text-gray-600">{new Date(chat.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
