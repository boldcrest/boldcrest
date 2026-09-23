'use client'

import { useRef, useState } from 'react'

interface VimeoEmbedProps {
  url: string
  className?: string
  /** Native width/height of the video (from Vimeo oEmbed). Sets the box shape so
   *  square/portrait clips aren't cropped into 16:9. Falls back to 16:9. */
  aspect?: number | null
  /** true → Vimeo's native player (its own poster + play button, sound +
   *  controls), instead of the default silent looping background clip. */
  feature?: boolean
  /** Cover image (Vimeo oEmbed thumbnail). On the background player it sits over
   *  the iframe until playback actually starts, so it stays visible when iOS
   *  low-power mode blocks autoplay (instead of a black box). */
  poster?: string | null
}

// The official Vimeo Player SDK, loaded once and shared. We use it only to detect
// when a background clip has actually started playing, so we can fade its cover.
// NOTE: we deliberately do NOT call setQuality() to pin a retina rendition anymore.
// Background players ignore the `quality` URL param, so setQuality has to switch
// renditions mid-playback — and on large clips (e.g. 2160×2160) that switch
// re-buffers and stalled the loop ~2s in. Letting Vimeo's adaptive stream choose
// keeps loops smooth (slightly softer on 2× screens — an acceptable trade).
type VimeoPlayer = {
  ready: () => Promise<void>
  on: (event: string, callback: () => void) => void
}
type VimeoPlayerCtor = new (el: HTMLIFrameElement) => VimeoPlayer
let sdkPromise: Promise<VimeoPlayerCtor> | null = null
function loadVimeoSDK(): Promise<VimeoPlayerCtor> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'))
  const existing = (window as unknown as { Vimeo?: { Player?: VimeoPlayerCtor } })
    .Vimeo?.Player
  if (existing) return Promise.resolve(existing)
  if (!sdkPromise) {
    sdkPromise = new Promise<VimeoPlayerCtor>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://player.vimeo.com/api/player.js'
      s.async = true
      s.onload = () => {
        const P = (window as unknown as { Vimeo?: { Player?: VimeoPlayerCtor } })
          .Vimeo?.Player
        if (P) resolve(P)
        else reject(new Error('Vimeo SDK missing'))
      }
      s.onerror = () => reject(new Error('Vimeo SDK failed to load'))
      document.head.appendChild(s)
    })
  }
  return sdkPromise
}

function extractVimeoId(url: string): string | null {
  // Handles: vimeo.com/123456, vimeo.com/video/123456, player.vimeo.com/video/123456
  const match = url.match(/(?:vimeo\.com\/(?:video\/)?)(\d+)/)
  return match ? match[1] : null
}

export default function VimeoEmbed({
  url,
  className = '',
  aspect,
  feature = false,
  poster,
}: VimeoEmbedProps) {
  const videoId = extractVimeoId(url)
  // Native aspect from oEmbed; default to 16:9 when unknown. The box is set to this
  // aspect and the background player fills it exactly, so the clip shows true shape.
  const aspectRatio = aspect && aspect > 0 ? aspect : 16 / 9

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const playerRef = useRef<VimeoPlayer | null>(null)
  const [bgPlaying, setBgPlaying] = useState(false)

  // Once the frame is loaded, attach the SDK player only to learn when the clip is
  // actually playing, so we can fade the cover off it.
  const onIframeLoad = () => {
    const iframe = iframeRef.current
    if (!iframe || playerRef.current) return
    loadVimeoSDK()
      .then((Player) => {
        if (playerRef.current) return
        const player = new Player(iframe)
        playerRef.current = player

        // Fade the cover the moment the clip is genuinely playing. On a cold first
        // load the SDK often finishes attaching AFTER the iframe's URL-driven
        // autoplay has already emitted its 'play', so that event is missed and the
        // cover would stay up over a clip that IS playing — listening to
        // 'timeupdate' as well catches that missed start. Fires once via the guard.
        // If autoplay is truly blocked (iOS low-power), neither event fires, so the
        // cover correctly stays.
        let started = false
        const onStarted = () => {
          if (started) return
          started = true
          setBgPlaying(true)
        }
        player.on('play', onStarted)
        player.on('timeupdate', onStarted)
        return player.ready().catch(() => {})
      })
      .catch(() => {})
  }

  if (!videoId) {
    return (
      <div
        className={`flex items-center justify-center bg-bg-card text-text-tertiary ${className}`}
        style={{ aspectRatio }}
      >
        Invalid Vimeo URL
      </div>
    )
  }

  // Feature player: Vimeo's native player — its own poster + play button, with
  // sound and controls — themed to the brand accent. Interactive (no background
  // mode), so clicking plays the video in place.
  if (feature) {
    // Vimeo keeps adding interface to the player (ask-AI, chapters, transcript,
    // collections, cast buttons), and anything not switched off explicitly can
    // come back on with one of their releases. The JokaDent reel player turns
    // the lot off by name; the same list is used here so the only chrome is the
    // transport, tinted to the brand accent. dnt=1 keeps Vimeo from tracking.
    const playerParams = new URLSearchParams({
      playsinline: '1',
      title: '0',
      byline: '0',
      portrait: '0',
      dnt: '1',
      color: 'a3a3a3',
      pip: '0',
      airplay: '0',
      chromecast: '0',
      like: '0',
      watchlater: '0',
      share: '0',
      embed: '0',
      vimeo_logo: '0',
      cc: '0',
      transcript: '0',
      chapters: '0',
      quality_selector: '0',
      speed: '0',
      collections: '0',
      ask_ai: '0',
    })
    const playerUrl = `https://player.vimeo.com/video/${videoId}?${playerParams}`
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio }}>
        <iframe
          src={playerUrl}
          className="absolute inset-0 h-full w-full border-none"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="Vimeo video"
        />
      </div>
    )
  }

  // autopause=0: Vimeo pauses every other player on the page when one starts,
  // which a rail of six background reels would trip over constantly. dnt=1 for
  // the same reason as the feature player.
  const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1&playsinline=1&autopause=0&dnt=1`

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio }}>
      <iframe
        ref={iframeRef}
        src={embedUrl}
        onLoad={onIframeLoad}
        // Fill the native-aspect box 1:1 (the box already matches the clip's shape).
        className="pointer-events-none absolute inset-0 h-full w-full border-none"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
        title="Vimeo video"
      />
      {poster && (
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${
            bgPlaying ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ backgroundImage: `url(${poster})` }}
        />
      )}
    </div>
  )
}
