'use client'

import { useState, useEffect } from 'react'

interface NotificationSettingsProps {
  onToast: (message: string, type?: 'success' | 'error') => void
}

export default function NotificationSettings({ onToast }: NotificationSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifyTime, setNotifyTime] = useState('09:00')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
    // 기존 구독 여부 확인
    checkSubscription()
  }, [])

  async function checkSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setIsSubscribed(!!sub)
    } catch {}
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      return reg
    } catch (err) {
      console.error('SW registration failed:', err)
      return null
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return Uint8Array.from(Array.from(rawData).map((c) => c.charCodeAt(0)))
  }

  async function handleSubscribe() {
    if (!('PushManager' in window)) {
      onToast('이 브라우저는 Web Push를 지원하지 않습니다.', 'error')
      return
    }

    setIsLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        onToast('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.', 'error')
        return
      }

      const reg = await registerServiceWorker()
      if (!reg) throw new Error('Service worker registration failed')

      const existingSub = await reg.pushManager.getSubscription()
      if (existingSub) await existingSub.unsubscribe()

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), notifyTime: `${notifyTime}:00` }),
      })

      if (!res.ok) throw new Error('Subscribe API failed')

      setIsSubscribed(true)
      onToast(`매일 ${notifyTime}에 알림을 드릴게요!`)
      setIsOpen(false)
    } catch (err) {
      console.error(err)
      onToast('알림 설정에 실패했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUnsubscribe() {
    setIsLoading(true)
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()
      }

      const res = await fetch('/api/push/unsubscribe', { method: 'POST' })
      if (!res.ok) throw new Error('Unsubscribe API failed')

      setIsSubscribed(false)
      onToast('알림이 해제되었습니다.')
    } catch (err) {
      console.error(err)
      onToast('알림 해제에 실패했습니다.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="알림 설정"
        className="text-[13px] text-[#5b4f85] hover:text-[#1e1b2e] px-3 py-1.5 rounded-lg hover:bg-[#ede9ff] transition-colors flex items-center gap-1.5"
      >
        <span>{isSubscribed ? '🔔' : '🔕'}</span>
        <span className="hidden sm:inline">알림</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-lg border border-[#ddd6f9] p-4 z-50">
          <h3 className="text-[14px] font-semibold text-[#1e1b2e] mb-3">알림 설정</h3>

          {permission === 'denied' ? (
            <p className="text-[13px] text-red-500">
              브라우저에서 알림이 차단되어 있습니다. 설정에서 직접 허용해 주세요.
            </p>
          ) : (
            <>
              <div className="mb-3">
                <label className="block text-[12px] text-[#5b4f85] mb-1">알림 시간</label>
                <input
                  type="time"
                  value={notifyTime}
                  onChange={(e) => setNotifyTime(e.target.value)}
                  className="w-full border border-[#ddd6f9] rounded-lg px-3 py-2 text-[13px] text-[#1e1b2e] focus:outline-none focus:ring-2 focus:ring-[#9585c2]"
                />
                <p className="text-[11px] text-[#9585c2] mt-1">단 한 번의 알람만 가능합니다</p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  className="w-full bg-[#7c6fc2] hover:bg-[#6a5cb0] text-white text-[13px] font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? '처리 중...' : '알림 설정하기'}
                </button>
                {isSubscribed && (
                  <button
                    onClick={handleUnsubscribe}
                    disabled={isLoading}
                    className="w-full bg-transparent border border-[#ddd6f9] text-[#5b4f85] hover:bg-[#ede9ff] text-[13px] py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    알림 해제
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 드롭다운 외부 클릭 시 닫기 */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  )
}
