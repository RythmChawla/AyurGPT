'use client'

import React from 'react'
import { motion } from 'framer-motion'

const features = [
  {
    id: 1,
    title: 'Interactive Chatbot',
    description: 'Ask Ayurvedic questions and get answers from classical texts with proper citations',
    icon: '💬',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 2,
    title: 'Dosha Assessment',
    description: 'Discover your unique Ayurvedic constitution (Prakriti) with personalized insights',
    icon: '📊',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 3,
    title: 'Herb Library',
    description: 'Explore traditional herbs and their properties through an Ayurvedic perspective',
    icon: '🌿',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 4,
    title: 'Symptom Checker',
    description: 'Understand symptoms through Ayurvedic concepts and wellness approaches',
    icon: '🔍',
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 5,
    title: 'Personalized Dashboard',
    description: 'Track your wellness journey with recommendations based on your Dosha',
    icon: '📈',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 6,
    title: 'Source Citations',
    description: 'Every answer backed by classical Ayurvedic texts with proper references',
    icon: '📚',
    color: 'from-rose-500 to-pink-500',
  },
]

export function Features() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title mb-4">Powerful Features</h2>
          <p className="section-subtitle">Everything you need for Ayurvedic wellness education</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="card-wellness group"
            >
              <div className={`text-5xl mb-4 inline-block p-3 rounded-lg bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
