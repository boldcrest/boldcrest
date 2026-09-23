'use client'

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { useTranslations } from 'next-intl'
import { extractVimeoRef } from '@/lib/vimeo'

/* ────────────────────────────────────────────────────────────────────────────
   Ported from the JokaDent patient reel (src/components/site/Testimonials.tsx).
   That player is the most developed one across our sites and every awkward bit
   of it was earned, so this is a faithful port rather than a fresh build — the
   comments explaining WHY are carried over with it. Only the chrome is
   different: BoldCrest tokens instead of the navy palette, Vimeo only (JokaDent
   also plays local files), and next-intl for the labels.
   ──────────────────────────────────────────────────────────────────────────── */

function PlayIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2Z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="4.5" width="4" height="15" rx="1" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" />
    </svg>
  )
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" stroke="none" />
      {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M16 9a4.2 4.2 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" />}
    </svg>
  )
}

function FullscreenIcon({ exit }: { exit: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {exit ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
    </svg>
  )
}

function ReplayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" />
      <path d="M4.5 3.8v3.9h3.9" />
    </svg>
  )
}

const clock = (s: number) => {
  const t = Math.max(0, Math.floor(s || 0))
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`
}

/** a mouse (or trackpad) is the main pointer: it can drag the rail, so it never
 *  presses on the player itself */
const MOUSE_QUERY = '(hover: hover) and (pointer: fine)'
const hasMouse = () => window.matchMedia(MOUSE_QUERY).matches
const subscribeMouse = (onChange: () => void) => {
  const query = window.matchMedia(MOUSE_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/** What the reel's controls drive. */
type Media = {
  play: () => void
  pause: () => void
  /** Resolves once the player is actually at that second, so a resume can
   *  wait for the seek before it starts playing. */
  seek: (seconds: number) => Promise<void>
  setMuted: (muted: boolean) => void
  paused: () => boolean
  /** the player's own full screen, where the page cannot take the reel there;
      rejects when that is refused too */
  fullscreen: () => Promise<void>
}

/**
 * The Vimeo player's address for our own controls, no tracking. Its controls
 * are off: with them on, its own play button showed in the middle at every
 * pause. A tap on the video then does nothing by itself, so the reel starts
 * from the page once the tap has moved focus into the player (see onBlur),
 * which still counts as a press inside its frame and plays with sound. The
 * rest of its interface is switched off too, in case a setting brings it back.
 */
const vimeoSrc = (url: string) => {
  // The privacy hash is part of the address for an unlisted video — drop it and
  // the player simply refuses. Reels are uploaded "Hide from Vimeo" with
  // embedding public, so they always carry one.
  const { id, hash } = extractVimeoRef(url)
  const u = new URL(`https://player.vimeo.com/video/${id ?? ''}`)
  if (hash) u.searchParams.set('h', hash)
  const params: Record<string, string> = {
    autoplay: '0',
    controls: '0',
    title: '0',
    byline: '0',
    portrait: '0',
    playsinline: '1',
    dnt: '1',
    autopause: '0',
    progress_bar: '0',
    volume: '0',
    fullscreen: '0',
    like: '0',
    watchlater: '0',
    share: '0',
    embed: '0',
    vimeo_logo: '0',
    pip: '0',
    airplay: '0',
    chromecast: '0',
    cc: '0',
    transcript: '0',
    chapters: '0',
    quality_selector: '0',
    speed: '0',
    unmute_button: '0',
    collections: '0',
    ask_ai: '0',
    keyboard: '0',
  }
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  return u.toString()
}

/**
 * One reel: the poster at 9:16 with a play button in its bottom-left corner.
 * Playing swaps the poster for the video in place, with a timeline that can be
 * clicked or dragged, the time beside the play control and a sound toggle, the
 * way a reel plays in a feed. When it ends the poster returns and the corner
 * button turns into a replay.
 */
export default function ReelPlayer({
  vimeoUrl,
  poster,
  caption,
  active,
  onPlay,
  onExpand,
  inFeed = false,
  autoPlay = false,
  onClose,
  resumeFrom,
  preload = false,
  suspend = false,
  lastSeen = false,
}: {
  vimeoUrl: string
  poster?: string | null
  caption?: string
  active: boolean
  onPlay: () => void
  /** Given by the rail: open this reel full screen, in the feed, from where it
   *  has got to. Both the corner button and a double-click on a running reel
   *  go through here, so full screen is the same thing however it is asked
   *  for. Without it — a reel on its own, no feed around it — the player grows
   *  itself over the page instead. */
  onExpand?: (atSeconds: number) => void
  /** Inside the feed: it is already full screen, so no full-screen button. */
  inFeed?: boolean
  /** Inside the feed: this is the slide in view, so it should be playing. */
  autoPlay?: boolean
  /** Inside the feed: closes it. The control lives in the reel's own top-right
   *  corner rather than the viewport's, so it belongs to the picture. */
  onClose?: () => void
  /** Inside the feed: carry on from where the rail card had got to, instead of
   *  restarting. */
  resumeFrom?: number
  /** Do not build a player at all, even in view. Kept for a slide that must
   *  stay laid out without loading a second copy of a clip already playing
   *  elsewhere. */
  suspend?: boolean
  /** The reel this visitor opened last. Marked on the rail so they can find
   *  their way back to it. */
  lastSeen?: boolean
  /** Build the player now, before this reel is on screen. The feed does this
   *  for the neighbours either side, so arriving on one starts it instead of
   *  waiting on Vimeo and showing the cover meanwhile. */
  preload?: boolean
}) {
  const t = useTranslations('CaseStudy')
  const frame = useRef<HTMLIFrameElement>(null)
  const media = useRef<Media | null>(null)
  const track = useRef<HTMLSpanElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const [fullState, setFull] = useState(false)
  // "full screen" everywhere but an iPhone: the reel that is already playing
  // grows over the page, so nothing reloads and it carries straight on
  const [expanded, setExpanded] = useState(false)
  const full = fullState || expanded
  // whether the reel was running when a drag began, so letting go resumes it
  const resume = useRef(false)
  const mouse = useSyncExternalStore(subscribeMouse, hasMouse, () => false)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [ended, setEnded] = useState(false)
  const [muted, setMuted] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  // between the tap and the first frame: the corner button turns into a spinner
  const [loading, setLoading] = useState(false)
  // the player has answered and can be driven
  const [ready, setReady] = useState(false)
  // the neighbour reels are nudged into showing their first frame; while that
  // happens the player fires 'play', which must NOT make this the reel in view
  const priming = useRef(false)
  // Where a resumed reel must be. Vimeo will accept a seek made before it is
  // really playing and then start from the top anyway, so the position is held
  // against the player's own clock rather than asked for once and trusted.
  const resumeTarget = useRef<number | null>(null)
  const resumeTries = useRef(0)
  // Playback this reel actually asked for. A nudged neighbour's 'play' can
  // arrive long after the nudge is over — Vimeo answers when it answers — and
  // was then taken for the visitor starting that reel, which stole the feed
  // from the slide in view and sent it back to 0:00. Only a press, a tap
  // inside the frame, or the feed arriving on this slide sets this.
  const claimed = useRef(false)
  // Whether this reel is MEANT to be playing. The player's own paused flag
  // cannot answer that: it trails the real player by however long Vimeo takes
  // to answer, and a nudged neighbour leaves it reading "playing" when nothing
  // has started. Intent is written down here and acted on, rather than read
  // back off the player.
  const wantsPlay = useRef(false)
  const [primed, setPrimed] = useState(false)

  // The player is put on the page once the reel comes near the screen,
  // invisible over the cover, so the first tap lands inside the player. A
  // browser only lets a video start with sound from a press in its own frame;
  // a press on our button driving it from outside started it muted, or not
  // at all until a second press.
  const [inView, setInView] = useState(false)
  // the feed asks for neighbours up front; otherwise the observer decides
  const mounted = !suspend && (inView || preload)
  const onPlayRef = useRef(onPlay)
  useEffect(() => {
    onPlayRef.current = onPlay
  }, [onPlay])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // The player, driven through its API once it is running. It starts from a tap
  // inside it; our own buttons (the keyboard, a replay) drive it from outside,
  // muted if the browser refuses sound that way.
  useEffect(() => {
    const el = frame.current
    if (!mounted || !el) return
    let cancelled = false
    let player: import('@vimeo/player').default | null = null
    let isPaused = true
    void import('@vimeo/player').then(({ default: Player }) => {
      if (cancelled) return
      const p = new Player(el)
      player = p
      // the sound icon follows the player, not what we asked of it: a browser
      // can start a reel muted on its own, or refuse to unmute it
      const syncMuted = () =>
        void Promise.all([p.getMuted(), p.getVolume()])
          .then(([m, v]) => {
            if (!cancelled) setMuted(m || v === 0)
          })
          .catch(() => {})
      media.current = {
        play: () => {
          void p
            .play()
            .then(
              () =>
                new Promise<void>((done) =>
                  setTimeout(() => {
                    void p
                      .getPaused()
                      .then((still) => {
                        // it may have been scrolled past in the meantime, and
                        // the retry would start it again behind the visitor
                        if (still && !cancelled && wantsPlay.current) {
                          setMuted(true)
                          void p
                            .setMuted(true)
                            .then(() => p.play())
                            .catch(() => {})
                        }
                      })
                      .catch(() => {})
                      .finally(done)
                  }, 900),
                ),
            )
            .catch(() => {})
        },
        pause: () => void p.pause().catch(() => {}),
        seek: (s) => p.setCurrentTime(s).then(() => {}).catch(() => {}),
        setMuted: (m) => {
          void p
            .setMuted(m)
            .catch(() => {})
            .finally(() => setTimeout(syncMuted, 400))
        },
        paused: () => isPaused,
        fullscreen: () => p.requestFullscreen(),
      }
      p.on('loaded', () => {
        setReady(true)
        // every call has to swallow its own rejection: the player can be torn
        // down mid-flight (a reel scrolled past, the feed closed) and Vimeo
        // rejects with "Unknown player. Probably unloaded."
        void p.getDuration().then(setDuration).catch(() => {})
      })
      p.on('play', () => {
        isPaused = false
        // a priming play only exists to paint frame 0; it is not playback
        if (priming.current || !claimed.current) return
        // a tap inside the player started it: this reel becomes the one playing
        onPlayRef.current()
        syncMuted()
        setTimeout(syncMuted, 800)
        setLoading(false)
        setStarted(true)
        setEnded(false)
        setPlaying(true)
      })
      p.on('volumechange', syncMuted)
      p.on('pause', () => {
        isPaused = true
        setPlaying(false)
      })
      p.on('timeupdate', (d: { seconds: number; duration: number }) => {
        if (d.duration) setDuration(d.duration)
        const target = resumeTarget.current
        if (target !== null) {
          // near enough: the resume has taken, and the reel runs on untouched
          if (d.seconds >= target - 1) resumeTarget.current = null
          else if (d.seconds < 2 && resumeTries.current < 4) {
            // it started from the top after all — put it back, and keep the
            // transport where the visitor left it meanwhile
            resumeTries.current += 1
            void p.setCurrentTime(target).catch(() => {})
            return
          } else resumeTarget.current = null
        }
        setTime(d.seconds)
      })
      p.on('ended', () => {
        isPaused = true
        setPlaying(false)
        setEnded(true)
      })
    })

    // A tap on the invisible player moves focus into it, which the page sees
    // as its window losing focus, and the reel is started from here: the tap
    // was inside its frame, so it plays with sound. Focus comes back to the
    // page afterwards, so the next reel's tap is seen the same way.
    let waiting = 0
    let giveUp = 0
    const onBlur = () => {
      if (document.activeElement !== el) return
      setLoading(true)
      window.clearTimeout(waiting)
      window.clearTimeout(giveUp)
      claimed.current = true
      wantsPlay.current = true
      waiting = window.setTimeout(() => {
        const m = media.current
        if (!cancelled && m?.paused()) m.play()
        window.focus()
      }, 150)
      // a player that never answers does not leave the spinner turning
      giveUp = window.setTimeout(() => setLoading(false), 10000)
    }
    window.addEventListener('blur', onBlur)
    return () => {
      cancelled = true
      setReady(false)
      window.clearTimeout(waiting)
      window.clearTimeout(giveUp)
      window.removeEventListener('blur', onBlur)
      void player?.destroy().catch(() => {})
      media.current = null
    }
  }, [mounted])

  // grown over the page: Escape shrinks it back, the page does not scroll
  // under it, and the two things round the reel that would hold a fixed box
  // inside them let go while it is open (the card's own stacking, which would
  // leave later cards on top, and the rail's scroll container)
  useEffect(() => {
    if (!expanded) return
    const el = box.current
    const card = el?.closest<HTMLElement>('[data-reel-card]')
    const html = document.documentElement
    const saved = { overflow: html.style.overflow, z: card?.style.zIndex ?? '' }
    html.style.overflow = 'hidden'
    // 1800: over the header (999 / 1002) so the reel covers the floating menu,
    // and under the start-a-project overlay (1900) so that still wins if it is
    // opened. The card is `relative`, so giving it a z-index makes it a
    // stacking context — the fixed reel inside can only rise as far as the
    // card's own slot, which is why this is set here and not on the reel.
    if (card) card.style.zIndex = '1800'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false)
    document.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = saved.overflow
      if (card) card.style.zIndex = saved.z
      document.removeEventListener('keydown', onKey)
    }
  }, [expanded])

  // another reel started: this one goes back to its poster and play button,
  // from the beginning, so only one reel plays at once
  useEffect(() => {
    if (active) return
    const m = media.current
    wantsPlay.current = false
    m?.pause()
    m?.seek(0)
    const id = requestAnimationFrame(() => {
      setExpanded(false)
      setLoading(false)
      setStarted(false)
      setEnded(false)
      setPlaying(false)
      setScrubbing(false)
      setTime(0)
    })
    return () => cancelAnimationFrame(id)
  }, [active])

  useEffect(() => {
    media.current?.setMuted(muted)
  }, [muted])

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === box.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // A preloaded neighbour shows its OWN first frame rather than the cover: the
  // player is already built, so start it muted and stop it again on the first
  // frame. Scrolling onto it then reveals the video itself, and there is no
  // cover to swap out at all. Muted because a browser will not start it
  // otherwise — it is not the reel in view yet.
  useEffect(() => {
    if (!preload || active || !ready || primed) return
    const m = media.current
    if (!m) return
    let cancelled = false
    priming.current = true
    wantsPlay.current = false
    m.setMuted(true)
    m.play()
    const id = window.setTimeout(() => {
      if (cancelled) return
      m.pause()
      m.seek(0)
      priming.current = false
      setPrimed(true)
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(id)
      priming.current = false
    }
  }, [preload, active, ready, primed])

  // In the feed: the slide scrolled into view starts on its own. The browser
  // may refuse sound without a gesture on this particular reel — play() already
  // handles that by muting and retrying, which is how a reels feed behaves
  // anyway once you scroll past the one you tapped.
  const resumed = useRef(false)
  useEffect(() => {
    if (!autoPlay || !ready || !active) return
    const m = media.current
    if (!m) return
    claimed.current = true
    wantsPlay.current = true
    // Stated, not asked for. A slide in view is playing as far as the page is
    // concerned, so its transport is up from the first frame rather than
    // waiting on a 'play' event that may never come: the reel can already be
    // running from its neighbour nudge, and Vimeo then has nothing new to
    // report. 'pause' and 'ended' still correct this if it turns out wrong.
    setStarted(true)
    setEnded(false)
    setPlaying(true)
    // The reel this feed was opened from carries on where the card left off.
    // One seek is not enough: asked for before playback has really begun, Vimeo
    // takes it and then starts from the top anyway — measured, a card at 0:13
    // opened at 0:00 both when the seek was fired alongside play and when play
    // waited for it. So the position is also held from `timeupdate` above,
    // until the player's own clock agrees. The transport is moved straight away
    // so it never flashes 0:00 in the meantime.
    if (!resumed.current && resumeFrom && resumeFrom > 0.5) {
      resumed.current = true
      resumeTarget.current = resumeFrom
      resumeTries.current = 0
      setTime(resumeFrom)
      void m.seek(resumeFrom).then(() => m.play())
      return
    }
    m.play()
  }, [autoPlay, ready, active, resumeFrom])

  const play = () => {
    const m = media.current
    claimed.current = true
    wantsPlay.current = true
    onPlay()
    setEnded(false)
    if (!started) {
      setStarted(true)
      setLoading(true)
    }
    if (!m) return
    if (ended) m.seek(0)
    m.play()
  }

  const toggle = () => {
    const m = media.current
    if (!m || m.paused() || ended || !started) play()
    else {
      wantsPlay.current = false
      m.pause()
    }
  }

  const seek = (clientX: number) => {
    const el = track.current
    if (!media.current || !el || !duration) return
    const r = el.getBoundingClientRect()
    const s = Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * duration
    media.current.seek(s)
    setTime(s)
  }

  const endScrub = () => {
    if (!scrubbing) return
    setScrubbing(false)
    if (resume.current) media.current?.play()
  }

  const progress = duration ? Math.min(1, time / duration) : 0
  // In the feed a reel plays as soon as you land on it, so it never sits in a
  // "press to start" state: its transport is up from the first frame and the
  // corner button is only ever the replay at the end.
  const showControls = inFeed ? !ended : started && !ended
  const showCorner = ended || (!inFeed && !started)

  return (
    // the reel's place in the rail, kept while it is grown over the page
    <div className="relative aspect-[9/16] w-full">
      <div
        ref={box}
        className={
          expanded
            ? 'group fixed inset-0 z-[200]'
            : // no dark ground behind the cover: it showed as a thin line round
              // the rounded corners, where the edge is anti-aliased. The dark
              // only while a reel plays, under the video.
              `group absolute inset-0 overflow-hidden border border-border ${showControls ? 'bg-bg-card' : ''} ${full ? 'bg-bg' : 'rounded-[var(--radius-lg)]'}`
        }
      >
        {/* Full screen: the reel large in the middle. As the lightbox, over the
            site itself, dimmed; taken full screen by the browser (which shows
            nothing else) over its own cover treated the same way. The stage
            stays in the tree, so the player never reloads. */}
        {expanded && (
          <div aria-hidden className="absolute inset-0" onClick={() => setExpanded(false)}>
            {/* The same dim and blur the start-a-project panel puts over the
                site, so both overlays treat the page the same way: bg-black/40
                with a 6px blur, and the blur only where it is cheap — a fine
                pointer, or a screen big enough that it is not a phone. */}
            <div className="absolute inset-0 bg-black/40 [@media(min-width:700px)_and_(min-height:700px)]:backdrop-blur-[6px] [@media(pointer:fine)]:backdrop-blur-[6px]" />
          </div>
        )}
        {full && !expanded && poster && (
          <div aria-hidden className="absolute inset-0 overflow-hidden">
            <span
              className="absolute inset-0 scale-125 bg-cover bg-center blur-3xl grayscale"
              style={{ backgroundImage: `url(${poster})` }}
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        )}

        <div
          className={
            full
              ? // tall, but not wall to wall on a big screen: room above and
                // below, and a cap
                'absolute inset-0 m-auto aspect-[9/16] h-[min(calc(100%-6rem),960px)] max-w-[calc(100%-2rem)]'
              : 'absolute inset-0'
          }
        >
          {/* the X, just off the reel's top right corner (inside it on a narrow screen) */}
          {full && (
            <button
              type="button"
              onClick={() => (expanded ? setExpanded(false) : void document.exitFullscreen())}
              aria-label={t('exitFullscreen')}
              // Same frosted treatment as the play button and the header CTA.
              className="group/x absolute right-3 top-3 z-40 flex size-12 items-center justify-center text-white/80 transition-all duration-300 hover:text-white hover:[border-color:rgba(255,255,255,0.6)] sm:left-full sm:right-auto sm:top-0 sm:ml-4"
              style={{
                borderRadius: 'var(--radius-pill)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.45)',
                backgroundColor: 'rgba(10,10,10,0.72)',
                backdropFilter: 'blur(24px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          )}

          {/* rounded by a clip on its own layer, not a transform-free overflow:
              the playing video under a plain rounded overflow shimmered along
              the curve */}
          <div className={`absolute inset-0 overflow-hidden ${full ? 'rounded-[var(--radius-lg)] [transform:translateZ(0)]' : ''}`}>
            {mounted && (
              <iframe
                ref={frame}
                src={vimeoSrc(vimeoUrl)}
                aria-label={caption || t('reels')}
                allow="autoplay; fullscreen; picture-in-picture"
                // While the cover shows, the player lies invisible on top of
                // everything and takes the tap itself (a start with sound);
                // while it plays, it is under our controls and takes nothing.
                // A pixel larger than the box on every side: the player's frame
                // is laid out at fractional sizes, and along one edge the
                // ground showed through as a dark line.
                // With a mouse the cover is left to our own play button
                // instead: pressing on the player hands it focus straight away,
                // which started the reel when the press was the start of a drag
                // through the rail.
                className={`absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)] border-0 ${
                  showControls
                    ? 'pointer-events-none'
                    : mouse
                      ? 'pointer-events-none opacity-0'
                      : 'z-30 cursor-pointer opacity-0'
                }`}
              />
            )}

            {/* Close, in the reel's own top-right corner. It sits inside the
                clipped frame so it reads as part of the picture, and above the
                player (z-40) so it stays pressable while the invisible iframe
                is taking taps over the cover. */}
            {inFeed && onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t('exitFullscreen')}
                className="absolute right-3 top-3 z-40 flex size-12 items-center justify-center text-white/80 transition-all duration-300 hover:text-white hover:[border-color:rgba(255,255,255,0.6)]"
                style={{
                  borderRadius: 'var(--radius-pill)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: 'rgba(255,255,255,0.45)',
                  backgroundColor: 'rgba(10,10,10,0.72)',
                  backdropFilter: 'blur(24px) saturate(1.5)',
                  WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            )}

            {/* The cover. On a rail card it is the thing you press. In the
                feed it is only there so the frame is never black while the
                player gets going: it sits OVER the iframe (which is opaque
                black until it plays) and fades out on the first frame, so
                scrolling onto a reel shows the picture and then the video,
                never a hole. pointer-events-none so the tap still reaches the
                player underneath. */}
            {poster && (inFeed ? !started && !primed : !showControls) && (
              <span
                aria-hidden
                className={
                  inFeed
                    ? // Only until the first frame exists. Keying this off
                      // `playing` instead brought the cover back on every
                      // pause; once the reel has started, pausing should hold
                      // the frame you stopped on and the end should hold the
                      // last one, the way a reel does.
                      `pointer-events-none absolute inset-0 z-[35] bg-cover bg-center transition-opacity duration-200 ${started || primed ? 'opacity-0' : 'opacity-100'}`
                    : 'absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]'
                }
                style={{ backgroundImage: `url(${poster})` }}
              />
            )}

            <button
              type="button"
              onClick={toggle}
              // Double-click a running reel to open it full screen — the
              // same route as the corner button, so both land on the feed at
              // the same second. The two single clicks that precede the double
              // still fire, but they are a pause and a play, so they cancel
              // out and the reel is still running when it is handed over.
              onDoubleClick={
                !inFeed && onExpand
                  ? (e) => {
                      e.preventDefault()
                      onExpand(time)
                    }
                  : undefined
              }
              aria-label={ended ? t('replay') : playing ? t('pause') : t('play')}
              className="absolute inset-0 z-10 flex items-end justify-between p-[7%]"
            >
              {/* no nudge for the play glyph: its triangle is already drawn with
                  its centroid on the icon's centre, which is where the eye puts
                  the middle of a triangle, so extra left padding pushed it off */}
              {showCorner && (
                <span
                  // Same treatment as the header's floating CTA: frosted rather
                  // than a solid fill. Over a poster a white disc read as a
                  // sticker sitting on the image; this darkens and blurs
                  // whatever is behind it instead, so it belongs to the page the
                  // way the header button does.
                  className="relative flex size-12 items-center justify-center text-white/80 transition-all duration-300 group-hover:scale-105 group-hover:text-white group-hover:[border-color:rgba(255,255,255,0.6)]"
                  style={{
                    borderRadius: 'var(--radius-pill)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: 'rgba(255,255,255,0.45)',
                    backgroundColor: 'rgba(10,10,10,0.72)',
                    backdropFilter: 'blur(24px) saturate(1.5)',
                    WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
                  }}
                >
                  {loading ? (
                    <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                  ) : ended ? (
                    <ReplayIcon />
                  ) : (
                    <PlayIcon />
                  )}
                </span>
              )}

              {/* The reel they opened last, so they can pick the rail back up
                  where they left it. Plain text in the play button's own
                  colour rather than another pill — two pills in one corner
                  read as two controls, and this one is not pressable. The
                  gradient is only under this card: it is what makes the label
                  legible over a bright poster, and it doubles as the marker
                  that sets this card apart from the rest of the rail. */}
              {/* Only while the card is idle. Once it is playing the transport
                  owns that row, and the marker sat on top of it with its own
                  gradient doubling the transport's. */}
              {lastSeen && showCorner && (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-black/75 via-black/35 to-transparent"
                  />
                  {/* Across from the play button, where JokaDent puts the
                      patient's language. Plain text in the button's own colour,
                      not another pill — two pills in one corner read as two
                      controls, and this one is not pressable. h-12 matches the
                      button so the line sits on its centre rather than its
                      baseline. */}
                  <span className="pointer-events-none flex h-12 items-center text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/80">
                    {t('lastSeen')}
                  </span>
                </>
              )}

            </button>

            {showControls && (
              <>
                {/* full screen, top right: the reel with these same controls
                    where the browser allows it, the player's own full screen
                    otherwise (an iPhone only takes a video element or Vimeo there) */}
                {/* In the feed the top of the frame is left clear: the title
                    and the time both sit on one row above the transport, so
                    nothing covers the picture up there. On a rail card there is
                    no room for that row, so the time stays top-left. */}
                {!inFeed && (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-black/35 to-transparent" />
                    <span className="pointer-events-none absolute left-5 top-3 z-20 flex h-8 items-center text-[0.7rem] font-medium tabular-nums text-white/90">
                      {clock(time)} / {clock(duration)}
                    </span>
                  </>
                )}
                {!full && !inFeed && (
                  <button
                    type="button"
                    onClick={() => {
                      // From the rail this opens the reels feed, so scrolling
                      // moves to the next clip — the same thing a double-click
                      // does, so full screen behaves one way however it is
                      // asked for. On its own (no feed around it) the reel
                      // grows over the page instead, and on an iPhone it asks
                      // the player for its own full screen, the only one iOS
                      // gives a video.
                      if (onExpand) {
                        onExpand(time)
                        return
                      }
                      if (/iPhone|iPod/.test(navigator.userAgent) && media.current)
                        void media.current.fullscreen().catch(() => setExpanded(true))
                      else setExpanded(true)
                    }}
                    aria-label={t('fullscreen')}
                    className="absolute right-3 top-3 z-20 flex size-8 items-center justify-center text-white"
                  >
                    <FullscreenIcon exit={false} />
                  </button>
                )}
                <div
                  className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 via-black/40 to-transparent ${
                    inFeed ? 'h-48' : 'h-24'
                  }`}
                />

                {/* The title, inside the picture and above the transport, with
                    the time opposite it. Set near the body copy's size (the
                    description section is 1.15rem) rather than a caption size,
                    because in the feed this line is the only thing naming the
                    reel. */}
                {inFeed && (caption || duration > 0) && (
                  <div className="pointer-events-none absolute inset-x-5 bottom-14 z-20 flex items-end justify-between gap-6">
                    {caption ? (
                      <p className="max-w-[26ch] text-[1.05rem] font-medium leading-[1.45] text-white">
                        {caption}
                      </p>
                    ) : (
                      <span />
                    )}
                    <span className="shrink-0 text-[0.8rem] font-medium tabular-nums text-white/70">
                      {clock(time)} / {clock(duration)}
                    </span>
                  </div>
                )}
                <div className="absolute inset-x-3 bottom-3 z-20 flex items-center gap-2 text-white">
                  <button
                    type="button"
                    onClick={toggle}
                    aria-label={playing ? t('pause') : t('play')}
                    className="flex size-8 shrink-0 items-center justify-center"
                  >
                    {playing ? <PauseIcon /> : <PlayIcon size={16} />}
                  </button>

                  {/* the timeline: press anywhere on it to jump there, drag to scrub */}
                  <span
                    ref={track}
                    role="slider"
                    tabIndex={0}
                    aria-label={t('seek')}
                    aria-valuemin={0}
                    aria-valuemax={Math.round(duration)}
                    aria-valuenow={Math.round(time)}
                    aria-valuetext={`${clock(time)} / ${clock(duration)}`}
                    onPointerDown={(e) => {
                      const m = media.current
                      if (!m) return
                      e.currentTarget.setPointerCapture(e.pointerId)
                      resume.current = !m.paused()
                      m.pause()
                      setScrubbing(true)
                      seek(e.clientX)
                    }}
                    onPointerMove={(e) => {
                      if (scrubbing) seek(e.clientX)
                    }}
                    onPointerUp={endScrub}
                    onPointerCancel={endScrub}
                    onKeyDown={(e) => {
                      const m = media.current
                      if (!m || !duration || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
                      e.preventDefault()
                      const s = Math.min(duration, Math.max(0, time + (e.key === 'ArrowLeft' ? -2 : 2)))
                      m.seek(s)
                      setTime(s)
                    }}
                    className="group/seek relative flex h-6 min-w-0 flex-1 cursor-pointer touch-none items-center outline-none"
                  >
                    <span
                      className={`relative w-full rounded-full bg-white/30 transition-[height] ${
                        scrubbing ? 'h-[5px]' : 'h-[3px] group-hover/seek:h-[5px]'
                      }`}
                    >
                      <span className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${progress * 100}%` }} />
                      <span
                        className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-opacity ${
                          scrubbing ? 'opacity-100' : 'opacity-0 group-hover/seek:opacity-100 group-focus-visible/seek:opacity-100'
                        }`}
                        style={{ left: `${progress * 100}%` }}
                      />
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    aria-label={muted ? t('unmute') : t('mute')}
                    className="flex size-8 shrink-0 items-center justify-center"
                  >
                    <SoundIcon muted={muted} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
