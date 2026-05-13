'use client'

import React from 'react'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold mb-4">AyurGPT</h3>
            <p className="text-sm">
              AI-powered Ayurvedic wellness platform combining classical wisdom with modern AI.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Features</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/chat" className="hover:text-emerald-400">Chatbot</Link></li>
              <li><Link href="/dosha" className="hover:text-emerald-400">Dosha Quiz</Link></li>
              <li><Link href="/herbs" className="hover:text-emerald-400">Herbs</Link></li>
              <li><Link href="/symptoms" className="hover:text-emerald-400">Symptoms</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-emerald-400">About Ayurveda</Link></li>
              <li><Link href="/faq" className="hover:text-emerald-400">FAQ</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-400">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400">Terms</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <p className="text-sm mb-2">support@ayurgpt.com</p>
            <p className="text-sm text-gray-400">
              For educational purposes only. Not a substitute for professional medical advice.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <p className="text-center text-sm text-gray-500">
            &copy; 2024 AyurGPT. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
