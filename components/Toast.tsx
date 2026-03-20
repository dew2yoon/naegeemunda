'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
        ${type === 'success' ? 'bg-[#7c3aed] text-white' : 'bg-red-500 text-white'}`}
    >
      {message}
    </div>
  )
}
