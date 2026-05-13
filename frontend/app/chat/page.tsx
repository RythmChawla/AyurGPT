'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/lib/store'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Array<{ title: string; content: string }>
  created_at: string
}

export default function ChatPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [ragStatus, setRagStatus] = useState<{ isReady: boolean; chunks: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasHydrated) return

    if (!isAuthenticated) {
      router.push('/login')
    } else {
      // Check RAG status
      checkRagStatus()
    }
  }, [hasHydrated, isAuthenticated, router])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkRagStatus = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/v1/rag/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setRagStatus({ isReady: data.isReady, chunks: data.chunks?.total || 0 })
      }
    } catch (error) {
      console.error('Error checking RAG status:', error)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setInputValue('')
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Create placeholder for assistant message
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      sources: [],
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: inputValue }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let sources: Array<{ title: string; content: string }> = []
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'sources') {
                sources = parsed.sources
              } else if (parsed.type === 'text') {
                fullContent += parsed.content
                // Update the assistant message with streaming content
                setMessages(prev => 
                  prev.map(m => 
                    m.id === assistantMessage.id 
                      ? { ...m, content: fullContent, sources }
                      : m
                  )
                )
              }
            } catch {
              // Ignore parse errors for partial JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: 'Sorry, there was an error processing your request. Please try again.' }
            : m
        )
      )
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
          <p className="mb-4">Please log in to access the chat.</p>
          <Link href="/login" className="btn-primary">Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - RAG Status & Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="glass-effect p-4 rounded-2xl sticky top-24">
              <h2 className="font-bold text-lg mb-4">AyurGPT</h2>

              <button
                onClick={handleNewChat}
                className="btn-primary w-full mb-4 !py-2 !text-sm"
              >
                New Chat
              </button>

              {/* RAG Status */}
              <div className="p-3 bg-gray-50 rounded-lg mb-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Knowledge Base</p>
                {ragStatus ? (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${ragStatus.isReady ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
                    <span className="text-sm text-gray-700">
                      {ragStatus.isReady ? `${ragStatus.chunks} chunks indexed` : 'No documents yet'}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Checking...</p>
                )}
              </div>

              {/* Quick Tips */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Try asking about:</p>
                <button
                  onClick={() => setInputValue('What are the three doshas in Ayurveda?')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  Three Doshas
                </button>
                <button
                  onClick={() => setInputValue('What herbs help with digestion?')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  Digestive Herbs
                </button>
                <button
                  onClick={() => setInputValue('How can I balance my Vata dosha?')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 bg-white rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  Vata Balance
                </button>
              </div>
            </div>
          </motion.div>

          {/* Main Chat Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            <div className="glass-effect p-6 rounded-2xl h-96 overflow-y-auto mb-6 bg-white bg-opacity-60">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="text-5xl mb-4">🌿</div>
                  <p className="text-lg font-semibold mb-2">Welcome to AyurGPT Chat</p>
                  <p className="text-sm text-center max-w-sm">
                    Ask questions about Ayurvedic wellness, herbs, doshas, and lifestyle practices.
                    Our AI will provide educational information from classical Ayurvedic texts.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-lg ${msg.role === 'user' ? '' : ''}`}>
                        <div
                          className={`px-4 py-3 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-emerald-500 text-white rounded-br-none'
                              : 'bg-gray-200 text-gray-900 rounded-bl-none'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content || (isLoading && msg.role === 'assistant' ? '' : '')}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {/* Sources Display */}
                        {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                            <p className="text-xs font-medium text-emerald-700 mb-1">Sources:</p>
                            {msg.sources.map((source, sIdx) => (
                              <p key={sIdx} className="text-xs text-emerald-600 truncate">
                                {source.title}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="px-4 py-3 rounded-lg bg-gray-200 text-gray-900 rounded-bl-none">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="glass-effect p-4 rounded-2xl">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="Ask about Ayurvedic wellness, herbs, or doshas..."
                  className="input-field flex-1"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="btn-primary !px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? '...' : 'Send'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Shift + Enter for new line, Enter to send
              </p>
            </div>

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200"
            >
              <p className="text-xs text-blue-800">
                <strong>Disclaimer:</strong> This information is for educational purposes only and does not replace professional medical advice.
                Always consult a qualified healthcare provider for medical concerns.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
