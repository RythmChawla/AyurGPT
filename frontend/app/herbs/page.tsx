'use client'

import React, { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Herb } from '@/types'

export default function HerbsPage() {
  const [herbs, setHerbs] = useState<Herb[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchHerbs = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.listHerbs(page * 10, 10, search)
        setHerbs(response.items)
        setTotal(response.total)
      } catch (error) {
        console.error('Error fetching herbs:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHerbs()
  }, [page, search])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="section-title mb-4">Ayurvedic Herb Library</h1>
          <p className="section-subtitle mb-6">Explore traditional herbs and their properties</p>

          <input
            type="text"
            placeholder="Search herbs by name, Sanskrit name, or properties..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="input-field max-w-md"
          />
        </motion.div>

        {isLoading ? (
          <div className="text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <p>Loading herbs...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {herbs.map((herb, index) => (
                <motion.div
                  key={herb.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card-wellness flex flex-col"
                >
                  <h3 className="text-xl font-bold mb-2">{herb.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{herb.sanskrit_name}</p>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3 flex-grow">{herb.description}</p>
                  
                  {/* Dosha effects preview */}
                  {herb.dosha_effects && (
                    <div className="mb-4 flex gap-2">
                      {herb.dosha_effects.Vata && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Vata</span>
                      )}
                      {herb.dosha_effects.Pitta && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Pitta</span>
                      )}
                      {herb.dosha_effects.Kapha && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Kapha</span>
                      )}
                    </div>
                  )}

                  <Link
                    href={`/herbs/${herb.id}`}
                    className="btn-primary !w-full !text-sm"
                  >
                    Learn More
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {total > 10 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white disabled:bg-gray-300 hover:bg-emerald-600 transition-colors"
                >
                  Previous
                </button>
                <span className="text-gray-600">
                  Page {page + 1} of {Math.ceil(total / 10)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * 10 >= total}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white disabled:bg-gray-300 hover:bg-emerald-600 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
