'use client'

import React, { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { useAuthStore, useUserProfileStore } from '@/lib/store'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DoshaAnswer {
  id: string
  text: string
}

interface DoshaQuestion {
  id: string
  question: string
  answers?: DoshaAnswer[]
}

export default function DoshaPage() {
  const [questions, setQuestions] = useState<DoshaQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showResults, setShowResults] = useState(false)
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const { doshaProfile, setDoshaProfile } = useUserProfileStore()
  const router = useRouter()

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await apiClient.getDoshaQuestions()
        setQuestions(Array.isArray(response) ? response : [])
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching questions:', error)
        setIsLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    setAnswers({
      ...answers,
      [questionId]: answerId,
    })
  }

  const handleSubmit = async () => {
    if (!hasHydrated) {
      return
    }

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    try {
      const profile = await apiClient.submitDoshaAssessment(answers)
      setDoshaProfile(profile)
      setShowResults(true)
    } catch (error) {
      console.error('Error submitting assessment:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  if (isLoading && questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (showResults && doshaProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-wellness text-center"
          >
            <h1 className="text-4xl font-bold mb-4">Your Dosha Profile</h1>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { dosha: 'Vata', score: doshaProfile.vata_score, color: 'bg-blue-100' },
                { dosha: 'Pitta', score: doshaProfile.pitta_score, color: 'bg-red-100' },
                { dosha: 'Kapha', score: doshaProfile.kapha_score, color: 'bg-green-100' },
              ].map((item) => (
                <div key={item.dosha} className={`${item.color} p-4 rounded-lg`}>
                  <h3 className="font-semibold mb-2">{item.dosha}</h3>
                  <p className="text-2xl font-bold">{item.score.toFixed(0)}%</p>
                </div>
              ))}
            </div>

            <p className="text-gray-700 mb-6">{doshaProfile.dosha_description}</p>

            <p className="text-sm text-gray-600 mb-4">
              Your primary Dosha is <strong>{doshaProfile.primary_dosha}</strong>
              {doshaProfile.secondary_dosha && (
                <> with secondary <strong>{doshaProfile.secondary_dosha}</strong></>
              )}
            </p>

            <Link href="/chat" className="btn-primary inline-block">
              Get Personalized Recommendations
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) return null

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-12">
      <div className="mx-auto max-w-2xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-wellness"
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <h2 className="text-2xl font-bold mb-6">{currentQuestion.question}</h2>

          {/* Answers */}
          <div className="space-y-3 mb-8">
            {currentQuestion.answers?.map((answer) => (
              <label
                key={answer.id}
                className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all hover:border-emerald-500"
                style={{
                  borderColor: answers[currentQuestion.id] === answer.id ? '#10b981' : '#e5e7eb',
                  backgroundColor: answers[currentQuestion.id] === answer.id ? '#f0fdf4' : 'white',
                }}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={answer.id}
                  checked={answers[currentQuestion.id] === answer.id}
                  onChange={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                  className="mr-3"
                />
                <span>{answer.text}</span>
              </label>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {currentQuestionIndex === questions.length - 1 ? 'See Results' : 'Next'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
