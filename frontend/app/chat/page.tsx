'use client'

import React, { useState, useEffect, useRef } from 'react'
import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ChatMessage, ChatHistory as ChatHistoryType } from '@/types'

export default function ChatPage() {
  const { isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [chatId, setChatId] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatHistoryType[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasHydrated) {
      return
    }

    if (!isAuthenticated) {
      router.push('/login')
    } else {
      loadChatHistory()
    }
  }, [hasHydrated, isAuthenticated, router])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatHistory = async () => {
    try {
      const chats = await apiClient.listChats(0, 20)
      setChatHistory(chats)
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
  }

  const handleLoadChat = async (chat: ChatHistoryType) => {
    try {
      const fullChat = await apiClient.getChatHistory(chat.id)
      setMessages(fullChat.messages || [])
      setChatId(chat.id)
      setShowHistory(false)
    } catch (error) {
      console.error('Error loading chat:', error)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setChatId(null)
    setInputValue('')
  }

  const handleDeleteChat = async (chatIdToDelete: string) => {
    try {
      await apiClient.deleteChat(chatIdToDelete)
      await loadChatHistory()
      if (chatId === chatIdToDelete) {
        handleNewChat()
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: inputValue,
      created_at: new Date().toISOString(),
    }

    setMessages([...messages, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await apiClient.sendMessage(inputValue, chatId ?? undefined)
      
      const responseChatId = response.message?.metadata?.chat_history_id
      if (!chatId && responseChatId) {
        setChatId(responseChatId)
        await loadChatHistory()
      }

      setMessages(prev => [...prev, response.message])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: Date.now().toString(),
        role: 'assistant' as const,
        content: 'Sorry, there was an error processing your request. Please try again.',
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errorMessage])
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
          {/* Sidebar - Chat History */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="glass-effect p-4 rounded-2xl sticky top-24">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg">Chats</h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="lg:hidden text-emerald-600 hover:text-emerald-800"
                >
                  {showHistory ? '✕' : '≡'}
                </button>
              </div>

              <button
                onClick={handleNewChat}
                className="btn-primary w-full mb-4 !py-2 !text-sm"
              >
                ➕ New Chat
              </button>

              <AnimatePresence>
                {(showHistory || typeof window !== 'undefined' && window.innerWidth >= 1024) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 max-h-96 overflow-y-auto"
                  >
                    {chatHistory.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No chats yet</p>
                    ) : (
                      chatHistory.map((chat) => (
                        <motion.div
                          key={chat.id}
                          whileHover={{ x: 5 }}
                          className="group relative"
                        >
                          <button
                            onClick={() => handleLoadChat(chat)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              chatId === chat.id
                                ? 'bg-emerald-100 text-emerald-900 font-semibold'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <div className="truncate">{chat.title || 'Untitled'}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(chat.created_at).toLocaleDateString()}
                            </div>
                          </button>
                          <button
                            onClick={() => handleDeleteChat(chat.id)}
                            className="absolute right-1 top-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm"
                          >
                            🗑️
                          </button>
                        </motion.div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-emerald-500 text-white rounded-br-none'
                            : 'bg-gray-200 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
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
