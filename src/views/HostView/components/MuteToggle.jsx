import { useState } from 'react'
import { isMuted, setMuted } from '../../../audio/audioEngine'

export function MuteToggle() {
  const [muted, setMutedState] = useState(isMuted())

  function toggle() {
    const next = !muted
    setMuted(next)
    setMutedState(next)
  }

  return (
    <button className="mute-toggle" onClick={toggle} title={muted ? 'تشغيل الصوت' : 'كتم الصوت'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 9v6h4l5 5V4L8 9H4z" fill="currentColor" />
        {muted ? (
          <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path
            d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    </button>
  )
}
