'use client'

import React, { useState } from 'react'
import { apiClient } from '@/lib/api'
import { motion } from 'framer-motion'
import type { SymptomAnalysis } from '@/types'

export default function SymptomCheckerPage() {
  const [symptoms, setSymptoms] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = async (value: string) => {
    setInput(value)
    if (value.length > 1) {
      try {
        const sug = await apiClient.getSymptomSuggestions(value)
        setSuggestions(sug)
      } catch {
        setSuggestions([])
      }
    } else {
      setSuggestions([])
    }
  }

  const addSymptom = (symptom?: string) => {
    const toAdd = symptom || input.trim()
    if (toAdd && !symptoms.includes(toAdd)) {
      setSymptoms([...symptoms, toAdd])
      setInput('')
      setSuggestions([])
    }
  }

  const handleAddSymptom = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSymptom()
    }
  }

  const handleRemoveSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index))
  }

  const handleAnalyze = async () => {
    if (symptoms.length === 0) return

    setIsLoading(true)
    try {
      const result = await apiClient.analyzeSymptoms(symptoms)
      setAnalysis(result)
    } catch (error) {
      console.error('Error analyzing symptoms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-12">
      <div className="mx-auto max-w-3xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-wellness mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Ayurvedic Symptom Checker</h1>
          <p className="text-gray-600 mb-6">
            Understand your symptoms through an Ayurvedic wellness perspective. This is for educational purposes only.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Enter Symptoms</label>
            <div className="relative mb-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyPress={handleAddSymptom}
                    placeholder="e.g., dry skin, poor digestion, anxiety..."
                    className="input-field w-full"
                  />
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => addSymptom(suggestion)}
                          className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-sm text-gray-700 border-b last:border-b-0"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => addSymptom()}
                  className="btn-primary"
                  disabled={!input.trim()}
                >
                  Add
                </button>
              </div>
            </div>

            {symptoms.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">{symptoms.length} symptom(s) added</p>
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((symptom, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {symptom}
                      <button
                        onClick={() => handleRemoveSymptom(index)}
                        className="text-emerald-600 hover:text-emerald-800 font-bold"
                      >
                        ×
                      </button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={symptoms.length === 0 || isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Symptoms'}
          </button>
        </motion.div>

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Dosha Involvement */}
            <div className="card-wellness mb-8">
              <h2 className="text-2xl font-bold mb-6">Dosha Involvement</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-blue-100 p-4 rounded-lg text-center border-2 border-blue-300"
                >
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Vata</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.round((analysis.possible_dosha_involvement?.vata || 0) * 100)}%
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-red-100 p-4 rounded-lg text-center border-2 border-red-300"
                >
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Pitta</p>
                  <p className="text-3xl font-bold text-red-600">
                    {Math.round((analysis.possible_dosha_involvement?.pitta || 0) * 100)}%
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-green-100 p-4 rounded-lg text-center border-2 border-green-300"
                >
                  <p className="text-sm text-gray-600 mb-2 font-semibold">Kapha</p>
                  <p className="text-3xl font-bold text-green-600">
                    {Math.round((analysis.possible_dosha_involvement?.kapha || 0) * 100)}%
                  </p>
                </motion.div>
              </div>

              <p className="text-gray-700 leading-relaxed">{analysis.explanation}</p>
            </div>

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="card-wellness mb-8">
                <h3 className="text-2xl font-bold mb-4">Wellness Suggestions</h3>
                <ul className="space-y-3">
                  {analysis.recommendations.map((rec: string, i: number) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 text-gray-700"
                    >
                      <span className="text-emerald-600 font-bold text-lg">✓</span>
                      <span>{rec}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            {analysis.disclaimer && (
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded">
                <p className="text-sm text-amber-900 font-semibold mb-2">Important Disclaimer:</p>
                <p className="text-sm text-amber-800">{analysis.disclaimer}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
