'use client'

import React from 'react'
import { motion } from 'framer-motion'

const steps = [
  {
    step: 1,
    title: 'Take Dosha Quiz',
    description: 'Start by understanding your unique Ayurvedic constitution (Prakriti)',
  },
  {
    step: 2,
    title: 'Chat with AI',
    description: 'Ask questions and get personalized answers based on your Dosha',
  },
  {
    step: 3,
    title: 'Explore Herbs',
    description: 'Discover traditional herbs suited to your constitution',
  },
  {
    step: 4,
    title: 'Track Wellness',
    description: 'Monitor your wellness journey with personalized recommendations',
  },
]

export function HowItWorks() {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title mb-4">How It Works</h2>
          <p className="section-subtitle">Simple steps to discover your wellness potential</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Number circle */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 flex items-center justify-center text-white font-bold text-lg mb-4">
                {item.step}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
              <p className="text-gray-600 text-sm">{item.description}</p>

              {/* Arrow (hidden on last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 -right-4 text-emerald-500 text-2xl">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
