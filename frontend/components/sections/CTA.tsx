'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-gray-200">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="section-title mb-4">Ready to Begin Your Wellness Journey?</h2>
          <p className="section-subtitle mb-8">
            Join thousands discovering Ayurvedic wellness with AI guidance
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary">
              🚀 Get Started Free
            </Link>
            <Link href="/about" className="btn-secondary">
              📚 Learn More
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-600">
            No credit card required. Start exploring immediately.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
