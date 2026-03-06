import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RotateCcw, RotateCw, PictureInPicture2, AlertCircle,
  Gauge,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  src: string
  poster?: string
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2]

function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function VideoPlayer({ src, poster }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const seekDraggingRef = useRef(false)
  const lastTapRef = useRef({ time: 0, x: 0 })
  const keyFocusRef = useRef(false)
  const speedMenuRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [pulse, setPulse] = useState<{ icon: 'play' | 'pause' | 'fwd' | 'rwd' | null; key: number }>({ icon: null, key: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [speedIdx, setSpeedIdx] = useState(2) // 1x default
  const [isBuffering, setIsBuffering] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [hoverTime, setHoverTime] = useState<{ pct: number; time: number } | null>(null)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [hasPiP, setHasPiP] = useState(false)

  // Check PiP support
  useEffect(() => {
    setHasPiP(document.pictureInPictureEnabled ?? false)
  }, [])

  // Auto-pause when scrolled out of view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (!e.isIntersecting) { videoRef.current?.pause() } },
      { threshold: 0.25 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Fullscreen change
  useEffect(() => {
    const fn = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', fn)
    return () => document.removeEventListener('fullscreenchange', fn)
  }, [])

  // Pause the auto-hide timer while the speed menu is open
  useEffect(() => {
    if (showSpeedMenu && hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }
  }, [showSpeedMenu])

  // Click-outside to close speed menu
  useEffect(() => {
    if (!showSpeedMenu) return
    const handler = (e: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSpeedMenu])

  // Controls auto-hide
  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  const showAndResetHide = useCallback(() => {
    setShowControls(true)
    if (playing) scheduleHide()
  }, [playing, scheduleHide])

  useEffect(() => {
    if (!playing) {
      setShowControls(true)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    } else {
      scheduleHide()
    }
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }
  }, [playing, scheduleHide])

  // Keyboard shortcuts (only when container focused/hovered)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onKey = (e: KeyboardEvent) => {
      if (!keyFocusRef.current) return
      const v = videoRef.current
      if (!v) return
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); return }
      if (e.code === 'ArrowRight') { e.preventDefault(); seek(5); return }
      if (e.code === 'ArrowLeft') { e.preventDefault(); seek(-5); return }
      if (e.code === 'KeyM') { toggleMute(); return }
      if (e.code === 'KeyF') { toggleFullscreen(); return }
      if (e.code === 'ArrowUp') { e.preventDefault(); v.volume = Math.min(1, v.volume + 0.1); setVolume(v.volume); return }
      if (e.code === 'ArrowDown') { e.preventDefault(); v.volume = Math.max(0, v.volume - 0.1); setVolume(v.volume); return }
    }
    const onEnter = () => { keyFocusRef.current = true }
    const onLeave = () => { keyFocusRef.current = false }
    document.addEventListener('keydown', onKey)
    container.addEventListener('mouseenter', onEnter)
    container.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('keydown', onKey)
      container.removeEventListener('mouseenter', onEnter)
      container.removeEventListener('mouseleave', onLeave)
    }
  })

  // Drag-to-seek (mousedown + mousemove + mouseup)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!seekDraggingRef.current) return
      applySeekFromClient(e.clientX)
    }
    const onUp = () => { seekDraggingRef.current = false }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [])

  function applySeekFromClient(clientX: number) {
    const bar = progressRef.current
    const v = videoRef.current
    // Always read duration from the element, never from stale state
    if (!bar || !v || !isFinite(v.duration) || v.duration === 0) return
    const rect = bar.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    v.currentTime = pct * v.duration
    setCurrentTime(v.currentTime)
  }

  function seek(deltaSec: number) {
    const v = videoRef.current
    // Always read duration from the element so we never use a stale closure value
    if (!v || !isFinite(v.duration) || v.duration === 0) return
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + deltaSec))
    setCurrentTime(v.currentTime)
    showAndResetHide()
    firePulse(deltaSec > 0 ? 'fwd' : 'rwd')
  }

  function firePulse(icon: typeof pulse.icon) {
    setPulse({ icon, key: Date.now() })
    setTimeout(() => setPulse(p => ({ ...p, icon: null })), 600)
  }

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    // Capture paused state BEFORE calling play/pause — it flips immediately
    const wasPaused = v.paused
    if (wasPaused) { v.play() } else { v.pause() }
    firePulse(wasPaused ? 'play' : 'pause')
    showAndResetHide()
  }

  function toggleMute() {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    if (!v.muted) v.volume = volume || 1
    setMuted(v.muted)
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current
    if (!v) return
    const val = Number(e.target.value)
    v.volume = val; v.muted = val === 0
    setVolume(val); setMuted(val === 0)
  }

  function toggleFullscreen() {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen()
    else document.exitFullscreen()
  }

  function togglePiP() {
    const v = videoRef.current
    if (!v) return
    if (document.pictureInPictureElement) document.exitPictureInPicture()
    else v.requestPictureInPicture?.()
  }

  function cycleSpeed() {
    const v = videoRef.current
    if (!v) return
    const next = (speedIdx + 1) % SPEEDS.length
    v.playbackRate = SPEEDS[next]
    setSpeedIdx(next)
    setShowSpeedMenu(false)
  }

  function setSpeed(idx: number) {
    const v = videoRef.current
    if (!v) return
    v.playbackRate = SPEEDS[idx]
    setSpeedIdx(idx)
    setShowSpeedMenu(false)
  }

  // Touch: double-tap to seek ±10s
  function handleTouch(e: React.TouchEvent<HTMLDivElement>) {
    const touch = e.touches[0]
    const now = Date.now()
    const dt = now - lastTapRef.current.time
    const width = containerRef.current?.clientWidth ?? 1
    if (dt < 300) {
      // double tap
      const x = touch.clientX
      if (x < width * 0.4) { seek(-10) }
      else if (x > width * 0.6) { seek(10) }
      else { togglePlay() }
      lastTapRef.current = { time: 0, x }
    } else {
      lastTapRef.current = { time: now, x: touch.clientX }
      showAndResetHide()
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const speed = SPEEDS[speedIdx]

  const pulseIcons = {
    play: <Play size={32} fill="white" />,
    pause: <Pause size={32} fill="white" />,
    fwd: <RotateCw size={32} />,
    rwd: <RotateCcw size={32} />,
  }

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className={cn(
        'relative w-full aspect-video bg-black select-none overflow-hidden outline-none',
        isFullscreen && 'aspect-auto h-screen w-screen'
      )}
      style={{ cursor: showControls ? 'default' : 'none' }}
      onMouseMove={showAndResetHide}
      onTouchStart={handleTouch}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
        onTimeUpdate={() => {
          const v = videoRef.current
          if (!v) return
          setCurrentTime(v.currentTime)
          if (v.buffered.length > 0)
            setBuffered((v.buffered.end(v.buffered.length - 1) / v.duration) * 100)
        }}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration ?? 0)}
        onPlay={() => { setPlaying(true); setIsBuffering(false) }}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setCurrentTime(0) }}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onError={() => setHasError(true)}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-white">
          <AlertCircle size={32} className="text-danger" />
          <p className="text-sm text-white/70">Failed to load video</p>
        </div>
      )}

      {/* Buffering spinner */}
      <AnimatePresence>
        {isBuffering && !hasError && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tap pulse feedback */}
      <AnimatePresence>
        {pulse.icon && (
          <motion.div
            key={pulse.key}
            initial={{ opacity: 0.9, scale: 0.5 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center text-white"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/40">
              {pulseIcons[pulse.icon]}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Big initial play button */}
      <AnimatePresence>
        {!playing && currentTime === 0 && !hasError && (
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-black/55 backdrop-blur-sm border border-white/20 text-white hover:bg-black/70 hover:scale-105 transition-all">
              <Play size={28} fill="white" className="ml-1" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && !hasError && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-0 left-0 right-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.18) 75%, transparent 100%)' }}
          >
            {/* Progress bar */}
            <div
              ref={progressRef}
              className="mx-3 mb-2 mt-4 cursor-pointer group/bar"
              style={{ height: '16px', display: 'flex', alignItems: 'center' }}
              onMouseDown={(e) => { seekDraggingRef.current = true; applySeekFromClient(e.clientX) }}
              onClick={(e) => applySeekFromClient(e.clientX)}
              onMouseMove={(e) => {
                const bar = progressRef.current
                if (!bar || !duration) return
                const rect = bar.getBoundingClientRect()
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
                setHoverTime({ pct: pct * 100, time: pct * duration })
              }}
              onMouseLeave={() => setHoverTime(null)}
            >
              {/* Hover time tooltip */}
              {hoverTime && (
                <div
                  className="pointer-events-none absolute -top-8 px-1.5 py-0.5 rounded bg-black/80 text-white text-[11px] tabular-nums"
                  style={{ left: `calc(${hoverTime.pct}% + 12px)`, transform: 'translateX(-50%)' }}
                >
                  {formatTime(hoverTime.time)}
                </div>
              )}
              <div className="relative w-full h-1 rounded-full bg-white/20 group-hover/bar:h-[5px] transition-all duration-150">
                {/* Buffer */}
                <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${buffered}%` }} />
                {/* Played */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${progress}%`, background: 'rgb(var(--color-accent))' }}
                />
                {/* Thumb */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 7px)` }}
                />
              </div>
            </div>

            {/* Bottom control row */}
            <div className="flex items-center gap-2 px-3 pb-3 pt-1">

              {/* Play / Pause */}
              <button onClick={togglePlay} className="text-white hover:text-white/70 transition-colors shrink-0">
                {playing ? <Pause size={17} fill="white" /> : <Play size={17} fill="white" className="ml-px" />}
              </button>

              {/* Seek ±10 */}
              <button onClick={() => seek(-10)} className="text-white/80 hover:text-white transition-colors shrink-0">
                <RotateCcw size={14} />
              </button>
              <button onClick={() => seek(10)} className="text-white/80 hover:text-white transition-colors shrink-0">
                <RotateCw size={14} />
              </button>

              {/* Time */}
              <span className="text-[11px] text-white/75 tabular-nums whitespace-nowrap">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex-1 min-w-0" />

              {/* Speed */}
              <div className="relative" ref={speedMenuRef}>
                <button
                  onClick={() => setShowSpeedMenu(open => !open)}
                  className="flex items-center gap-0.5 text-white/80 hover:text-white transition-colors text-[11px] font-semibold tabular-nums"
                >
                  <Gauge size={13} />
                  {speed === 1 ? '1×' : `${speed}×`}
                </button>
                <AnimatePresence>
                  {showSpeedMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute bottom-full right-0 mb-2 w-24 rounded-xl overflow-hidden bg-black/95 border border-white/15 shadow-2xl py-1"
                    >
                      {SPEEDS.map((s, i) => (
                        <button
                          key={s}
                          onClick={(e) => { e.stopPropagation(); setSpeed(i) }}
                          className={cn(
                            'w-full px-3 py-2 text-left text-xs transition-colors flex items-center justify-between',
                            i === speedIdx
                              ? 'text-white bg-white/10 font-semibold'
                              : 'text-white/60 hover:text-white hover:bg-white/8'
                          )}
                        >
                          <span>{s === 1 ? 'Normal' : `${s}×`}</span>
                          {i === speedIdx && <span className="text-[10px] opacity-60">✓</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={toggleMute} className="text-white hover:text-white/70 transition-colors">
                  {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-14 h-0.5 accent-white cursor-pointer"
                />
              </div>

              {/* PiP */}
              {hasPiP && (
                <button onClick={togglePiP} className="text-white/80 hover:text-white transition-colors shrink-0">
                  <PictureInPicture2 size={14} />
                </button>
              )}

              {/* Fullscreen */}
              <button onClick={toggleFullscreen} className="text-white hover:text-white/70 transition-colors shrink-0">
                {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
