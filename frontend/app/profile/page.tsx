'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { useAuthStore, useUserProfileStore } from '@/lib/store'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@/types'

export default function ProfilePage() {
  const { user, isAuthenticated, hasHydrated, setUser } = useAuthStore()
  const router = useRouter()
  const { doshaProfile, setDoshaProfile } = useUserProfileStore()
  const [userProfile, setUserProfile] = useState<User | null>(user)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editData, setEditData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
  })

  const loadProfile = useCallback(async () => {
    try {
      const profile = await apiClient.getCurrentUser()
      setUserProfile(profile)
      setEditData({
        full_name: profile.full_name || '',
        username: profile.username || '',
      })

      try {
        const savedDoshaProfile = await apiClient.getDoshaProfile()
        setDoshaProfile(savedDoshaProfile)
      } catch {
        // A missing dosha profile is expected before the quiz is completed.
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }, [setDoshaProfile])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    loadProfile()
  }, [hasHydrated, isAuthenticated, loadProfile, router])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const updatedUser = await apiClient.updateUserProfile(editData)
      setUserProfile(updatedUser)
      setUser(updatedUser)
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasHydrated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Please log in to view your profile.</p>
          <Link href="/login" className="btn-primary">Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="section-title mb-8">Your Profile</h1>

          {/* User Information */}
          <div className="card-wellness mb-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold">Personal Information</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isEditing
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editData.full_name}
                    onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                    className="input-field w-full"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                    className="input-field w-full"
                    placeholder="Your username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (read-only)
                  </label>
                  <input
                    type="email"
                    value={userProfile?.email || ''}
                    disabled
                    className="input-field w-full bg-gray-100"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="btn-primary w-full"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Full Name:</span>
                  <span className="font-semibold">{userProfile?.full_name || 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Username:</span>
                  <span className="font-semibold">{userProfile?.username}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold">{userProfile?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Member Since:</span>
                  <span className="font-semibold">
                    {userProfile?.created_at
                      ? new Date(userProfile.created_at).toLocaleDateString()
                      : 'Unknown'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dosha Profile */}
          {doshaProfile && (
            <div className="card-wellness mb-8">
              <h2 className="text-2xl font-bold mb-6">Your Dosha Profile</h2>
              <div className="mb-6">
                <p className="text-gray-700 mb-4">{doshaProfile.dosha_description}</p>
                <div className="grid grid-cols-3 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-blue-100 p-4 rounded-lg text-center"
                  >
                    <p className="text-sm text-gray-600 mb-2">Vata</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(doshaProfile.vata_score)}%
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-red-100 p-4 rounded-lg text-center"
                  >
                    <p className="text-sm text-gray-600 mb-2">Pitta</p>
                    <p className="text-2xl font-bold text-red-600">
                      {Math.round(doshaProfile.pitta_score)}%
                    </p>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-green-100 p-4 rounded-lg text-center"
                  >
                    <p className="text-sm text-gray-600 mb-2">Kapha</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(doshaProfile.kapha_score)}%
                    </p>
                  </motion.div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm text-gray-700">
                  <strong>Primary Dosha:</strong> {doshaProfile.primary_dosha}
                  {doshaProfile.secondary_dosha && ` with secondary ${doshaProfile.secondary_dosha}`}
                </p>
              </div>
              <Link href="/dosha" className="btn-secondary mt-4 inline-block">
                Retake Assessment
              </Link>
            </div>
          )}

          {!doshaProfile && (
            <div className="card-wellness mb-8 bg-yellow-50 border-2 border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Complete Your Dosha Assessment
              </h3>
              <p className="text-yellow-700 mb-4">
                You haven't completed a Dosha assessment yet. Take our personalized quiz to discover your Ayurvedic constitution.
              </p>
              <Link href="/dosha" className="btn-primary inline-block">
                Start Dosha Assessment
              </Link>
            </div>
          )}

          {/* Quick Links */}
          <div className="card-wellness">
            <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/chat"
                className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors text-center"
              >
                <div className="text-2xl mb-2">💬</div>
                <div className="font-semibold text-sm">Chat</div>
              </Link>
              <Link
                href="/dosha"
                className="p-4 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🌀</div>
                <div className="font-semibold text-sm">Dosha</div>
              </Link>
              <Link
                href="/herbs"
                className="p-4 rounded-lg bg-green-50 border border-green-200 hover:bg-green-100 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🌿</div>
                <div className="font-semibold text-sm">Herbs</div>
              </Link>
              <Link
                href="/symptoms"
                className="p-4 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors text-center"
              >
                <div className="text-2xl mb-2">🩺</div>
                <div className="font-semibold text-sm">Symptoms</div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
