'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Herb } from '@/types'

export default function HerbDetailPage() {
  const params = useParams()
  const herbId = params.id as string
  const [herb, setHerb] = useState<Herb | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)

  const loadHerb = useCallback(async () => {
    setIsLoading(true)
    try {
      const herbData = await apiClient.getHerb(herbId)
      setHerb(herbData)
    } catch (error) {
      console.error('Error loading herb:', error)
    } finally {
      setIsLoading(false)
    }
  }, [herbId])

  useEffect(() => {
    loadHerb()
  }, [loadHerb])

  const handleFavorite = async () => {
    try {
      await apiClient.favoriteHerb(herbId)
      setIsFavorited(true)
    } catch (error) {
      console.error('Error favoriting herb:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading herb information...</p>
        </div>
      </div>
    )
  }

  if (!herb) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-6">Herb not found</p>
          <Link href="/herbs" className="btn-primary">Back to Herbs</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link href="/herbs" className="text-emerald-600 hover:text-emerald-800 mb-6 inline-block">
          Back to Herbs
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-wellness mb-8"
        >
          <div className="flex justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{herb.name}</h1>
              {herb.sanskrit_name && (
                <p className="text-lg text-gray-600 italic mb-2">Sanskrit: {herb.sanskrit_name}</p>
              )}
              {herb.english_name && (
                <p className="text-lg text-gray-600 mb-4">English: {herb.english_name}</p>
              )}
            </div>
            <button
              onClick={handleFavorite}
              disabled={isFavorited}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isFavorited
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-red-500 hover:text-white'
              }`}
            >
              {isFavorited ? 'Favorited' : 'Add to Favorites'}
            </button>
          </div>

          {herb.description && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-2xl font-bold mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed">{herb.description}</p>
            </div>
          )}

          {herb.properties && Object.keys(herb.properties).length > 0 && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-2xl font-bold mb-4">Properties</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(herb.properties).map(([key, value]) => (
                  <div key={key} className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-gray-600 font-semibold">{key}</p>
                    <p className="text-lg text-emerald-700 font-bold">{String(value)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {herb.dosha_effects && Object.keys(herb.dosha_effects).length > 0 && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-2xl font-bold mb-4">Effect on Doshas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['Vata', 'Pitta', 'Kapha'] as const).map((dosha) => (
                  herb.dosha_effects?.[dosha] && (
                    <div key={dosha} className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="font-bold text-emerald-900 mb-2">{dosha}</p>
                      <p className="text-emerald-800 text-sm">{herb.dosha_effects[dosha]}</p>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}

          {herb.uses && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-2xl font-bold mb-4">Traditional Uses</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{herb.uses}</p>
            </div>
          )}

          {herb.preparation_methods && herb.preparation_methods.length > 0 && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-2xl font-bold mb-4">Preparation Methods</h2>
              <ul className="space-y-2">
                {herb.preparation_methods.map((method, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-emerald-600 mr-3 font-bold">-</span>
                    <span className="text-gray-700">{method}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {herb.contraindications && (
            <div className="mb-8 pb-8 border-b">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Contraindications</h2>
              <p className="text-gray-700 leading-relaxed bg-red-50 p-4 rounded-lg border border-red-200">
                {herb.contraindications}
              </p>
            </div>
          )}

          {herb.safety_warnings && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-yellow-600">Safety Information</h2>
              <p className="text-gray-700 leading-relaxed bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                {herb.safety_warnings}
              </p>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <p className="text-sm text-blue-800">
              <strong>Disclaimer:</strong> This information is for educational purposes only and should not be used for self-diagnosis or self-treatment.
              Always consult a qualified healthcare provider or Ayurvedic practitioner before using herbal remedies.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 justify-center"
        >
          <Link href="/chat" className="btn-primary">
            Ask about {herb.name}
          </Link>
          <Link href="/herbs" className="btn-secondary">
            Browse More Herbs
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
