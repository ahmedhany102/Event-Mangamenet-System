import { useCallback, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

type FeedbackQRModalProps = {
  eventId: number
  eventName: string
  onClose: () => void
}

export default function FeedbackQRModal({ eventId, eventName, onClose }: FeedbackQRModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [copyState, setCopyState] = useState<'idle' | 'done'>('idle')

  const feedbackUrl = `${window.location.origin}/feedback/${eventId}`

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `feedback-qr-${eventId}.png`
    link.click()
  }, [eventId])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(feedbackUrl)
      setCopyState('done')
      setTimeout(() => setCopyState('idle'), 2000)
    } catch {
      // ignore
    }
  }, [feedbackUrl])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Feedback QR Code</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-600">{eventName}</p>

        <div className="mb-6 flex justify-center">
          <div ref={canvasRef} className="rounded-lg border border-slate-200 bg-white p-3">
            <QRCodeCanvas value={feedbackUrl} size={256} />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Download QR Code
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
          >
            {copyState === 'done' ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  )
}