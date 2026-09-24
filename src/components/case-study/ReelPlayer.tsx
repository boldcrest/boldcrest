'use client'

import {
  useEffect,
  useLayoutEffect,
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

function PauseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="4.5" width="4" height="15" rx="1" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" />
    </svg>
  )
}

function SoundIcon({ muted, size = 16 }: { muted: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
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
  /** another reel into the same player, keeping its permissions */
  load: (url: string) => Promise<void>
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
/**
 * The shade under the transport and the one over the corner lines. Solid in
 * the player's own colour AT the frame's edge, so where the frame meets a
 * letterbox bar there is no step — a 70% black over a light picture was
 * visibly lighter than the bar beside it — and explicit sRGB stops to a fully
 * transparent end, because the utility gradient (an oklab run to
 * `transparent`) banded on iOS and its last stop drew as a line.
 */
const shade = (to: 'top' | 'bottom') =>
  `linear-gradient(in srgb to ${to}, rgb(10 10 10 / 1) 0%, rgb(10 10 10 / 0.55) 42%, rgb(10 10 10 / 0.18) 78%, rgb(10 10 10 / 0) 100%)`

/** One screen of the grown box: a neighbour's cover in the same 9:16 frame
 *  as the reel, so scrolling onto it looks like the next reel arriving. */
function CoverSlide({ poster }: { poster?: string | null }) {
  return (
    <div aria-hidden className="relative h-full w-full snap-start snap-always bg-bg">
      <div
        className="absolute inset-0 m-auto aspect-[9/16] w-full bg-cover bg-center"
        style={{ height: 'min(100%, calc(100vw * 16 / 9))', backgroundImage: poster ? `url(${poster})` : undefined }}
      />
    </div>
  )
}

/** The feed's arrow, for the grown player's corner line. */
function Arrow({ up = false }: { up?: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={up ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path d="M12 4.5v15M5.5 13l6.5 6.5 6.5-6.5" />
    </svg>
  )
}

/** A clip served as a file rather than through Vimeo — a path on this site or
 *  a plain video URL. The same player, driven through a <video> element. */
const isFile = (url: string) => /^\/(?!\/)|\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)

const vimeoSrc = (url: string, native = false) => {
  // The privacy hash is part of the address for an unlisted video — drop it and
  // the player simply refuses. Reels are uploaded "Hide from Vimeo" with
  // embedding public, so they always carry one.
  const { id, hash } = extractVimeoRef(url)
  const u = new URL(`https://player.vimeo.com/video/${id ?? ''}`)
  if (hash) u.searchParams.set('h', hash)
  const params: Record<string, string> = {
    autoplay: '0',
    // round and round: a reel that has ended does not sit on a replay button,
    // it starts again, and with this on the player never reports an end
    loop: '1',
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
  // On a phone the player is started by Vimeo itself, from its own address,
  // because that is the ONLY way it will start there: its API refuses play()
  // on iOS until the viewer has tapped inside the player, muted or not — the
  // documented behaviour, and the wall every retry here ran into. Native
  // autoplay must be muted; the speaker button asks for sound afterwards.
  if (native) {
    params.autoplay = '1'
    params.muted = '1'
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
  fill = false,
  soundOff = false,
  onSoundOff,
  playlist,
  index = 0,
  onWatched,
  shadeTop,
  shadeQuick = false,
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
  /** On a phone, the whole rail: the tapped card's player grows to full screen
   *  and the other reels are loaded INTO it on a swipe, so the one frame iOS
   *  has seen a tap in is the one that plays every reel — with sound, and
   *  without a second tap. `index` is this card's own place in it. */
  playlist?: { vimeoUrl: string; poster?: string | null; caption?: string }[]
  index?: number
  /** the reel in view while grown, every time it changes */
  onWatched?: (index: number) => void
  /** A shade over the top of the picture, the twin of the one under the
   *  transport, for the feed's lines to sit on when they are in the reel's
   *  corner. Comes and goes with them: `shadeQuick` follows an answer's
   *  160ms, otherwise the standing hint's 600ms. Undefined = never drawn. */
  shadeTop?: boolean
  shadeQuick?: boolean
  /** The one sound setting the whole feed shares. A reel that starts applies
   *  it; the speaker button on any reel changes it for every reel after. */
  soundOff?: boolean
  onSoundOff?: (off: boolean) => void
  /** The phone's full-screen dress: no card edge, no rounding, the close mark
   *  bare and lined up with the seconds. The frame is still 9:16 — the feed
   *  sizes it — and the clip is not cropped. */
  fill?: boolean
  /** Build the player now, before this reel is on screen. The feed does this
   *  for the neighbours either side, so arriving on one starts it instead of
   *  waiting on Vimeo and showing the cover meanwhile. */
  preload?: boolean
}) {
  const t = useTranslations('CaseStudy')
  const frame = useRef<HTMLIFrameElement>(null)
  const clip = useRef<HTMLVideoElement>(null)
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
  // waiting on the network mid-play — after a seek, or when the stream runs
  // dry — shown as a ring in the middle of the picture
  const [buffering, setBuffering] = useState(false)
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
  // A touch feed cannot drive Vimeo through its API (see vimeoSrc), so it
  // cannot prime a neighbour and cannot resume one it paused: the reel in view
  // is the only one built, fresh each time it comes into view, and it starts
  // itself. The cost is a moment on the cover on each arrival, which a phone
  // has to pay; a mouse keeps the neighbours ready as before.
  const nativeStart = inFeed && !mouse && !isFile(vimeoUrl)
  const mounted = !suspend && (nativeStart ? active : inView || preload)
  // The phone's reels: this card's player, tapped (so iOS trusts it), grown
  // over the page, with the rest of the rail loaded into it on a swipe. The
  // tap goes INTO the frame as on jokadent.com — that is what lets the player
  // obey afterwards — and from then on every reel plays with sound and no
  // second tap.
  const growOnTouch = !mouse && !inFeed && !!playlist && playlist.length > 0
  const grown = expanded && growOnTouch
  // which of the rail's reels the grown player is showing
  const [cursor, setCursor] = useState(index)
  // a reel being loaded into the player: its cover holds the picture meanwhile
  const [swapping, setSwapping] = useState(false)
  // what the grown player says in its corner
  const [note, setNote] = useState<'hint' | 'first' | 'last' | null>(null)
  const noteTimer = useRef(0)
  // Grown, the box scrolls natively between the reel and its neighbours'
  // covers (see the render): a swipe that starts on the player's frame still
  // scrolls it, which no touch listener of ours would see, and a tap still
  // reaches the frame, which is where iOS wants it before it allows sound.
  const stage = useRef<HTMLDivElement>(null)
  const settle = useRef(0)
  // for the player's own handlers, which are wired once
  const grownRef = useRef(false)
  const cursorRef = useRef(index)
  const swappingRef = useRef(false)
  const onWatchedRef = useRef(onWatched)
  useEffect(() => {
    grownRef.current = grown
    cursorRef.current = cursor
    swappingRef.current = swapping
    onWatchedRef.current = onWatched
  }, [grown, cursor, swapping, onWatched])
  // grown on a phone it wears the phone feed's dress: bare X, full-width
  // frame with bars, the feed's transport
  const fillLook = fill || grown
  const feedLook = inFeed || grown
  const shownPoster = grown ? (playlist?.[cursor]?.poster ?? poster) : poster
  const shownCaption = grown ? (playlist?.[cursor]?.caption ?? caption) : caption
  const onPlayRef = useRef(onPlay)
  useEffect(() => {
    onPlayRef.current = onPlay
  }, [onPlay])
  const soundOffRef = useRef(soundOff)
  useEffect(() => {
    soundOffRef.current = soundOff
  }, [soundOff])
  const mutedRef = useRef(false)
  const onSoundOffRef = useRef(onSoundOff)
  useEffect(() => {
    onSoundOffRef.current = onSoundOff
  }, [onSoundOff])

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
    if (!mounted) return
    let cancelled = false

    // The same transport over a <video> element. It answers at once and
    // never from another window, so none of the waiting the Vimeo branch does
    // is needed here — but the play/timeupdate handling is the same, so the
    // feed's resume and the neighbour nudge behave identically on both.
    const v = clip.current
    if (isFile(vimeoUrl) && v) {
      const syncMuted = () => setMuted(v.muted || v.volume === 0)
      media.current = {
        play: () => {
          void v.play().catch(() => {
            // sound refused without a gesture on this reel: the way a feed
            // behaves once you scroll past the one you tapped
            if (cancelled || !wantsPlay.current) return
            v.muted = true
            setMuted(true)
            void v.play().catch(() => {})
          })
        },
        pause: () => v.pause(),
        seek: (s) => {
          v.currentTime = s
          return Promise.resolve()
        },
        load: (url) => {
          v.src = url
          v.load()
          return Promise.resolve()
        },
        setMuted: (m) => {
          v.muted = m
          syncMuted()
        },
        paused: () => v.paused,
        fullscreen: () => {
          // iOS gives a <video> its own full screen and nothing else
          const w = v as HTMLVideoElement & { webkitEnterFullscreen?: () => void }
          if (v.requestFullscreen) return v.requestFullscreen()
          if (w.webkitEnterFullscreen) {
            w.webkitEnterFullscreen()
            return Promise.resolve()
          }
          return Promise.reject(new Error('no full screen'))
        },
      }
      const onMeta = () => {
        setReady(true)
        if (v.duration) setDuration(v.duration)
      }
      const onPlay = () => {
        if (priming.current || !claimed.current) return
        onPlayRef.current()
        // grown, this card is showing whichever reel was swiped to: the rail
        // marks that one, not the card's own, which onPlay has just stamped
        if (grownRef.current) onWatchedRef.current?.(cursorRef.current)
        syncMuted()
        setLoading(false)
        setSwapping(false)
        setStarted(true)
        setEnded(false)
        setPlaying(true)
      }
      const onPause = () => setPlaying(false)
      const onTime = () => {
        if (swappingRef.current) return
        if (v.duration) setDuration(v.duration)
        const target = resumeTarget.current
        if (target !== null) {
          if (v.currentTime >= target - 1) resumeTarget.current = null
          else if (v.currentTime < 2 && resumeTries.current < 4) {
            resumeTries.current += 1
            v.currentTime = target
            return
          } else resumeTarget.current = null
        }
        setTime(v.currentTime)
      }
      const onEnded = () => {
        setPlaying(false)
        setEnded(true)
      }
      v.addEventListener('loadedmetadata', onMeta)
      v.addEventListener('play', onPlay)
      v.addEventListener('pause', onPause)
      v.addEventListener('timeupdate', onTime)
      v.addEventListener('ended', onEnded)
      v.addEventListener('volumechange', syncMuted)
      const onWait = () => setBuffering(true)
      const onGo = () => setBuffering(false)
      v.addEventListener('waiting', onWait)
      v.addEventListener('seeking', onWait)
      v.addEventListener('seeked', onGo)
      v.addEventListener('playing', onGo)
      v.addEventListener('canplay', onGo)
      if (v.readyState >= 1) onMeta()
      return () => {
        cancelled = true
        setReady(false)
        v.removeEventListener('loadedmetadata', onMeta)
        v.removeEventListener('play', onPlay)
        v.removeEventListener('pause', onPause)
        v.removeEventListener('timeupdate', onTime)
        v.removeEventListener('ended', onEnded)
        v.removeEventListener('volumechange', syncMuted)
        v.removeEventListener('waiting', onWait)
        v.removeEventListener('seeking', onWait)
        v.removeEventListener('seeked', onGo)
        v.removeEventListener('playing', onGo)
        v.removeEventListener('canplay', onGo)
        media.current = null
      }
    }

    const el = frame.current
    if (!el) return
    let player: import('@vimeo/player').default | null = null
    let isPaused = true
    // the play watchdog's timer, so the teardown can stop it
    const watchdogRef = { current: 0 }
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
      // Sound refused without a gesture on this reel: start it muted instead,
      // the way a feed behaves once you scroll past the one you tapped. Not
      // if it has been scrolled past in the meantime — the retry would start
      // it again behind the visitor.
      let retries = 0
      const mutedRetry = () => {
        if (cancelled || !wantsPlay.current) return
        if (retries >= 2) {
          // Refused with sound and refused muted: the reel is not going to
          // start on its own. The cover comes off so the controls are there
          // and a tap can ask again, rather than a cover with nothing on it.
          setSwapping(false)
          setLoading(false)
          return
        }
        retries += 1
        setMuted(true)
        void p
          .setMuted(true)
          .then(() => p.play())
          .catch(() => {})
      }
      // The player's own word on whether it is playing cannot be trusted on a
      // phone: it says yes while the phone has blocked the start, and the reel
      // sits there. So a play request is judged by the clock — if the reel
      // has not moved within a moment and a half of being asked, it was
      // blocked, whatever was reported.
      let watchdog = 0
      let progressed = false
      const askAndWatch = () => {
        progressed = false
        window.clearTimeout(watchdog)
        watchdog = window.setTimeout(() => {
          if (!progressed) mutedRetry()
        }, 1500)
        watchdogRef.current = watchdog
      }
      media.current = {
        play: () => {
          askAndWatch()
          void p
            .play()
            // On a phone the refusal can be a REJECTION — and a rejection
            // skipped every check but this one, so a reel opened from a phone
            // never started at all.
            .catch(mutedRetry)
        },
        pause: () => void p.pause().catch(() => {}),
        seek: (s) => p.setCurrentTime(s).then(() => {}).catch(() => {}),
        load: (url) => {
          const { id, hash } = extractVimeoRef(url)
          // a fresh reel gets a fresh judgement: the retries spent on the last
          // one, and the last one's ticks, must not count for this one
          retries = 0
          progressed = false
          window.clearTimeout(watchdog)
          // the watch address with the hash, which is how a hidden video is
          // named to loadVideo; the embed options are the same as the frame's
          return p
            .loadVideo({
              url: `https://vimeo.com/${id ?? ''}${hash ? `/${hash}` : ''}`,
              autoplay: false,
              controls: false,
              title: false,
              byline: false,
              portrait: false,
              playsinline: true,
              dnt: true,
              autopause: false,
              loop: true,
              keyboard: false,
            } as Parameters<typeof p.loadVideo>[0])
            .then(() => {})
            .catch(() => {})
        },
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
        // 'play' is the player's word again, not the reel moving: keep watching
        window.clearTimeout(watchdog)
        watchdog = window.setTimeout(() => {
          if (!progressed) mutedRetry()
        }, 1500)
        watchdogRef.current = watchdog
        // a priming play only exists to paint frame 0; it is not playback
        if (priming.current || !claimed.current) return
        // a tap inside the player started it: this reel becomes the one playing
        onPlayRef.current()
        // grown, this card is showing whichever reel was swiped to: the rail
        // marks that one, not the card's own, which onPlay has just stamped
        if (grownRef.current) onWatchedRef.current?.(cursorRef.current)
        syncMuted()
        setTimeout(syncMuted, 800)
        setLoading(false)
        setSwapping(false)
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
        // a reel being swapped in: the old one's last ticks are not its time,
        // and not its progress either
        if (swappingRef.current) return
        if (d.seconds > 0) progressed = true
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
      p.on('bufferstart', () => setBuffering(true))
      p.on('bufferend', () => setBuffering(false))
      p.on('seeked', () => setBuffering(false))
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
      if (nativeStart || grownRef.current) {
        // On a touch feed the reel is already running; a tap on the picture
        // toggles its sound, the way a reel does. It goes through the frame
        // because that is where iOS needs the tap to be before it will let
        // the sound change — the speaker button, in our page, may be refused.
        const next = !mutedRef.current
        window.setTimeout(() => {
          if (cancelled) return
          media.current?.setMuted(next)
          setMuted(next)
          onSoundOffRef.current?.(next)
          // focus back out of the frame, or the next tap is not a change of
          // focus and is not seen at all
          el.blur()
          window.focus()
        }, 50)
        return
      }
      setLoading(true)
      window.clearTimeout(waiting)
      window.clearTimeout(giveUp)
      claimed.current = true
      wantsPlay.current = true
      waiting = window.setTimeout(() => {
        const m = media.current
        if (!cancelled && m?.paused()) m.play()
        window.focus()
        // on a phone the tapped card is the reels: it grows the moment it
        // has been asked to play, with the tap's permission inside it
        if (growOnTouch && !cancelled) {
          setCursor(index)
          setExpanded(true)
        }
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
      window.clearTimeout(watchdogRef.current)
      void player?.destroy().catch(() => {})
      media.current = null
    }
  }, [mounted, vimeoUrl, nativeStart, growOnTouch, index])

  // grown over the page: Escape shrinks it back, the page does not scroll
  // under it, and the two things round the reel that would hold a fixed box
  // inside them let go while it is open (the card's own stacking, which would
  // leave later cards on top, and the rail's scroll container)
  useEffect(() => {
    if (!expanded) return
    const el = box.current
    const card = el?.closest<HTMLElement>('[data-reel-card]')
    // iOS Safari lays a fixed box out against the nearest scroll container,
    // not the viewport: grown inside the rail, the reel sat where the rail
    // was, the rail's width by the card's height, and moved with the page.
    // So the rail stops being one while the reel is open (overflow visible,
    // no snap) and takes its position back after.
    const rail = el?.closest<HTMLElement>('[data-reel-rail]')
    const html = document.documentElement
    const saved = {
      overflow: html.style.overflow,
      z: card?.style.zIndex ?? '',
      rail: { overflow: rail?.style.overflow ?? '', snap: rail?.style.scrollSnapType ?? '', left: rail?.scrollLeft ?? 0 },
    }
    html.style.overflow = 'hidden'
    if (rail) {
      rail.style.overflow = 'visible'
      rail.style.scrollSnapType = 'none'
    }
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
      if (rail) {
        rail.style.overflow = saved.rail.overflow
        rail.style.scrollSnapType = saved.rail.snap
        rail.scrollLeft = saved.rail.left
      }
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
    mutedRef.current = muted
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
    if (nativeStart || !preload || active || !ready || primed) return
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
    if (nativeStart) {
      // Vimeo is starting this one itself, muted. Sound is asked for once it
      // is running, if the feed's setting wants it — the phone may or may not
      // grant that without a tap inside the player, and the speaker button
      // shows whichever it decided.
      setMuted(true)
      if (!soundOffRef.current) window.setTimeout(() => m.setMuted(false), 600)
      return
    }
    // The feed's one sound setting, applied as this reel takes over. It also
    // undoes the neighbour nudge, which had muted this reel to paint its first
    // frame in silence and then left it that way — so every reel after the
    // first was starting silent, and it was not the browser's doing.
    m.setMuted(soundOffRef.current)
    setMuted(soundOffRef.current)
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

  /** A line in the grown player's corner, for a while. */
  const say = (what: 'hint' | 'first' | 'last') => {
    setNote(what)
    window.clearTimeout(noteTimer.current)
    noteTimer.current = window.setTimeout(() => setNote(null), what === 'hint' ? 2600 : 1100)
  }
  useEffect(() => () => window.clearTimeout(noteTimer.current), [])

  /** Another of the rail's reels into this player. Past either end, the
   *  player says so instead. */
  const swapTo = (next: number) => {
    const list = playlist
    const m = media.current
    if (!list || !m) return
    if (next < 0 || next > list.length - 1) {
      say(next < 0 ? 'first' : 'last')
      return
    }
    // The scroll has landed on the next reel's cover; the frame now shows
    // that same cover (swapping) and is put back in the middle underneath
    // it, so the handover is invisible. Then the reel is loaded behind the
    // cover, which holds until its first frame, as a cover does.
    setSwapping(true)
    setCursor(next)
    setTime(0)
    setEnded(false)
    setBuffering(false)
    onWatched?.(next)
    claimed.current = true
    wantsPlay.current = true
    void m.load(list[next].vimeoUrl).then(() => {
      // asked with sound; a phone that refuses that starts it muted (see
      // mutedRetry) and a tap on the reel asks for the sound again
      m.setMuted(soundOffRef.current)
      setMuted(soundOffRef.current)
      m.play()
    })
  }

  // Grown: the frame sits in the middle of the box's scroll, one screen of
  // cover on each side that has a reel. Put it there whenever the box grows
  // or the reel changes, before paint, so nothing is seen moving.
  useLayoutEffect(() => {
    if (!grown) return
    const el = box.current
    if (!el) return
    el.scrollTo({ top: cursor > 0 ? el.clientHeight : 0, behavior: 'instant' as ScrollBehavior })
  }, [grown, cursor])

  /** The box has been scrolled: once it settles on a neighbour's cover, that
   *  reel is next; pulled past an end (iOS lets the scroll rubber-band and
   *  reports it), the corner says which end. */
  const onGrownScroll = () => {
    const el = box.current
    const list = playlist
    if (!el || !list) return
    const h = el.clientHeight
    const max = el.scrollHeight - h
    if (el.scrollTop < -8 && cursor === 0) say('first')
    else if (el.scrollTop > max + 8 && cursor === list.length - 1) say('last')
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const at = Math.round(el.scrollTop / h)
      if (Math.abs(el.scrollTop - at * h) > 2) return
      const middle = cursor > 0 ? 1 : 0
      if (at !== middle) swapTo(cursor + (at - middle))
    }, 90)
  }

  /** Back to the card. If a different reel was loaded while grown, the card's
   *  own comes back — the card is that reel, and stays it. */
  const collapse = () => {
    setExpanded(false)
    const m = media.current
    wantsPlay.current = false
    m?.pause()
    if (playlist && cursor !== index) {
      void m?.load(playlist[index].vimeoUrl)
      setCursor(index)
    }
    setStarted(false)
    setPlaying(false)
    setSwapping(false)
    setTime(0)
  }

  // grown: the hint, and the rail told where the visitor is
  useEffect(() => {
    if (!grown) return
    say('hint')
    onWatched?.(index)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grown])

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
    m.setMuted(soundOffRef.current)
    setMuted(soundOffRef.current)
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
    // the ring goes up the moment the visitor lands somewhere new; the player
    // takes it down when it has the frame
    setBuffering(true)
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
  const showControls = inFeed || grown ? !ended : started && !ended

  // The title row's height, so the shade under it can grow with it: a title
  // that wraps to three lines climbs 73px up the picture, and a fixed shade
  // left its top line on bare video.
  const titleRow = useRef<HTMLDivElement>(null)
  const [titleH, setTitleH] = useState(0)
  useEffect(() => {
    const el = titleRow.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setTitleH(e.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
    // the row is only in the tree while the controls are, so the observer is
    // attached when it appears rather than at mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showControls, inFeed, grown])
  const showCorner = ended || (!inFeed && !started)

  return (
    // the reel's place in the rail, kept while it is grown over the page
    <div className="relative aspect-[9/16] w-full">
      <div
        ref={box}
        // grown on a phone: the box scrolls, one screen per reel, and
        // settling on a neighbour's cover is the swipe to that reel
        onScroll={grown ? onGrownScroll : undefined}
        className={
          expanded
            ? grown
              ? 'group fixed inset-0 z-[200] overflow-y-auto overscroll-contain snap-y snap-mandatory bg-bg [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              : 'group fixed inset-0 z-[200]'
            : // no dark ground behind the cover: it showed as a thin line round
              // the rounded corners, where the edge is anti-aliased. The dark
              // only while a reel plays, under the video.
              // the hairline is a card's edge on the rail; a reel full screen,
              // boxed or filling, has no card to be the edge of
              `group absolute inset-0 overflow-hidden ${fillLook || inFeed ? 'bg-bg' : 'border border-border'} ${showControls && !fillLook ? 'bg-bg-card' : ''} ${full || fillLook ? 'bg-bg' : 'rounded-[var(--radius-lg)]'}`
        }
      >
        {/* Full screen: the reel large in the middle. As the lightbox, over the
            site itself, dimmed; taken full screen by the browser (which shows
            nothing else) over its own cover treated the same way. The stage
            stays in the tree, so the player never reloads. */}
        {expanded && (
          <div aria-hidden className="absolute inset-0" onClick={grown ? collapse : () => setExpanded(false)}>
            {/* The same dim and blur the start-a-project panel puts over the
                site, so both overlays treat the page the same way: bg-black/40
                with a 6px blur, and the blur only where it is cheap — a fine
                pointer, or a screen big enough that it is not a phone. */}
            <div
              className={
                grown
                  ? // a phone: solid, so nothing shows through round the reel
                    'absolute inset-0 bg-bg'
                  : 'absolute inset-0 bg-black/40 [@media(min-width:700px)_and_(min-height:700px)]:backdrop-blur-[6px] [@media(pointer:fine)]:backdrop-blur-[6px]'
              }
            />
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

        {grown && cursor > 0 && <CoverSlide poster={playlist?.[cursor - 1]?.poster} />}
        {/* grown, the frame's own screen in the scroll; otherwise nothing */}
        <div className={grown ? 'relative h-full w-full snap-start snap-always' : 'contents'}>
        <div
          className={
            grown
              ? // the phone feed's frame: 9:16 at the full width, centred, bars
                // above and below on the ground; clipped, for the move
                'absolute inset-0 m-auto aspect-[9/16] w-full overflow-hidden'
              : full
                ? // tall, but not wall to wall on a big screen: room above and
                  // below, and a cap
                  'absolute inset-0 m-auto aspect-[9/16] h-[min(calc(100%-6rem),960px)] max-w-[calc(100%-2rem)]'
                : 'absolute inset-0'
          }
          style={grown ? { height: 'min(100%, calc(100vw * 16 / 9))' } : undefined}
        >
          {/* the X, just off the reel's top right corner (inside it on a narrow screen) */}
          {full && !grown && (
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
          <div
            ref={stage}
            className={`absolute inset-0 overflow-hidden ${full && !fillLook ? 'rounded-[var(--radius-lg)] [transform:translateZ(0)]' : ''}`}
          >
            {mounted && isFile(vimeoUrl) && (
              <video
                ref={clip}
                src={vimeoUrl}
                playsInline
                loop
                preload="metadata"
                aria-label={caption || t('reels')}
                // the same footprint and the same say over taps as the iframe
                className={`absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)] border-0 object-contain ${
                  showControls || (!inFeed && onExpand)
                    ? 'pointer-events-none'
                    : mouse
                      ? 'pointer-events-none opacity-0'
                      : 'z-30 cursor-pointer opacity-0'
                }`}
              />
            )}
            {mounted && !isFile(vimeoUrl) && (
              <iframe
                ref={frame}
                src={vimeoSrc(vimeoUrl, nativeStart)}
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
                // A rail card never uses it either, whatever the pointer: a tap
                // there opens the feed, and a tap that lands inside the player
                // is a tap we have given away — on a phone that is what handed
                // the reel to the browser's own video player.
                className={`absolute -inset-px h-[calc(100%+2px)] w-[calc(100%+2px)] border-0 ${
                  nativeStart || grown
                    ? '' // takes the tap: see onBlur
                    : showControls || (!inFeed && onExpand && !growOnTouch)
                      ? 'pointer-events-none'
                      : mouse
                        ? 'pointer-events-none opacity-0'
                        : 'z-30 cursor-pointer opacity-0'
                }`}
              />
            )}

            {/* Grown on a phone: what the player has to say, in the corner
                level with the X and on the play glyph's left, on its own shade.
                SCROLL UP/DOWN when it opens; FIRST VIDEO or LAST VIDEO when a
                swipe asks for a reel that is not there. */}
            {grown && (
              <>
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-x-0 top-0 z-[34] h-32 transition-opacity ${
                    note === 'hint' ? 'duration-[600ms]' : 'duration-[160ms]'
                  } ${note ? 'opacity-100' : 'opacity-0'}`}
                  style={{ backgroundImage: shade('bottom') }}
                />
                <div className="pointer-events-none absolute left-[1.375rem] top-3 z-[45] flex h-12 items-center">
                  <span
                    className={`flex items-center gap-2 text-[0.8rem] uppercase tracking-[0.2em] transition-opacity ${
                      note === 'hint' ? 'text-white/55 duration-[600ms]' : 'text-white/70 duration-[160ms]'
                    } ${note ? 'opacity-100' : 'opacity-0'}`}
                  >
                    {note === 'first'
                      ? t('atTop')
                      : note === 'last'
                        ? t('atEnd')
                        : cursor === 0
                          ? t('scrollDown')
                          : cursor === (playlist?.length ?? 1) - 1
                            ? t('scrollUp')
                            : t('scrollBoth')}
                    <span className="flex items-center gap-1">
                      {(note === 'first' || (note === 'hint' && cursor === 0)) && <Arrow />}
                      {(note === 'last' || (note === 'hint' && cursor === (playlist?.length ?? 1) - 1)) && <Arrow up />}
                      {note === 'hint' && cursor > 0 && cursor < (playlist?.length ?? 1) - 1 && (
                        <>
                          <Arrow up />
                          <Arrow />
                        </>
                      )}
                    </span>
                  </span>
                </div>
              </>
            )}

            {/* Waiting on the network mid-play: the same ring the corner button
                turns on a first press, in the middle of the picture. Only once
                the reel has started — before that the corner already says so. */}
            {buffering && started && !ended && (
              <div aria-hidden className="pointer-events-none absolute inset-0 z-[35] grid place-items-center">
                <span className="size-9 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            )}

            {/* Close, in the reel's own top-right corner. It sits inside the
                clipped frame so it reads as part of the picture, and above the
                player (z-40) so it stays pressable while the invisible iframe
                is taking taps over the cover. */}
            {((inFeed && onClose) || grown) && (
              <button
                type="button"
                onClick={grown ? collapse : onClose}
                aria-label={t('exitFullscreen')}
                // Filling the screen, the mark's INK ends on the speaker's
                // line with the seconds, 22px in. Its strokes run 6→18 of a
                // 24 grid with round caps, so at 26px they stop 5.6px short of
                // the glyph box, which sits 11px inside the 48px button: the
                // button's own edge lands 5px in. Aligning box to box put the
                // mark visibly further in than the text it was meant to meet.
                className={`absolute top-3 z-40 flex size-12 items-center justify-center text-white/80 transition-all duration-300 hover:text-white hover:[border-color:rgba(255,255,255,0.6)] ${
                  fillLook ? 'right-[5px]' : 'right-3'
                }`}
                // Filling the screen, the mark stands on its own: a disc is
                // what lifts a control off a page it is sitting on, and here
                // there is no page under it — just the picture, edge to edge.
                // Bigger to make up for losing the disc around it.
                style={
                  fillLook
                    ? undefined
                    : {
                        borderRadius: 'var(--radius-pill)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: 'rgba(255,255,255,0.45)',
                        backgroundColor: 'rgba(10,10,10,0.72)',
                        backdropFilter: 'blur(24px) saturate(1.5)',
                        WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
                      }
                }
              >
                <svg
                  width={fillLook ? 26 : 18}
                  height={fillLook ? 26 : 18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={fillLook ? 1.6 : 1.8}
                  strokeLinecap="round"
                  aria-hidden
                  // Bare on a phone, with no disc, the mark needs its own
                  // ground: a soft shadow, so it holds on a white frame when
                  // the top shade is not there.
                  style={
                    fillLook
                      ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.55)) drop-shadow(0 0 8px rgba(0,0,0,0.35))' }
                      : undefined
                  }
                >
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
            {shownPoster && (feedLook ? (!started && !primed) || swapping : !showControls) && (
              <span
                aria-hidden
                className={
                  feedLook
                    ? // Only until the first frame exists. Keying this off
                      // `playing` instead brought the cover back on every
                      // pause; once the reel has started, pausing should hold
                      // the frame you stopped on and the end should hold the
                      // last one, the way a reel does.
                      `pointer-events-none absolute inset-0 z-[35] bg-cover bg-center transition-opacity duration-200 ${(started || primed) && !swapping ? 'opacity-0' : 'opacity-100'}`
                    : 'absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-[1.03]'
                }
                style={{ backgroundImage: `url(${shownPoster})` }}
              />
            )}

            <button
              type="button"
              onClick={() => {
                // A rail card on a phone is a thumbnail: pressing it goes
                // straight to the reels, full screen, rather than playing a
                // 62vw video in the middle of the page.
                if (!mouse && !inFeed && onExpand && !growOnTouch) {
                  onExpand(time)
                  return
                }
                toggle()
              }}
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
              // on a touch feed the picture's tap belongs to the frame under
              // this (sound), and play/pause is the transport's button
              className={`absolute inset-0 z-10 flex items-end justify-between p-[7%] ${
                nativeStart ? 'pointer-events-none' : ''
              }`}
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
                {!feedLook && (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-black/35 to-transparent" />
                    <span className="pointer-events-none absolute left-5 top-3 z-20 flex h-8 items-center text-[0.7rem] font-medium tabular-nums text-white/90">
                      {clock(time)} / {clock(duration)}
                    </span>
                  </>
                )}
                {!full && !feedLook && (
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
                  className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 ${feedLook ? '' : 'h-24'}`}
                  // In the feed the shade reaches as far up as the title does,
                  // plus room for the fade to finish above it: the row sits
                  // 56px up, so a one-line title gets the 144px it always had
                  // and a three-line one gets 56 + 73 + 72 = 201.
                  style={{
                    backgroundImage: shade('top'),
                    ...(feedLook ? { height: Math.max(144, 56 + titleH + 72) } : {}),
                  }}
                />
                {shadeTop !== undefined && (
                  <div
                    aria-hidden
                    // shorter than the one under the transport: there is one
                    // line up here, not a title, a clock and a bar
                    className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-32 transition-opacity ${
                      shadeQuick ? 'duration-[160ms]' : 'duration-[600ms]'
                    } ${shadeTop ? 'opacity-100' : 'opacity-0'}`}
                    style={{ backgroundImage: shade('bottom') }}
                  />
                )}

                {/* The title, inside the picture and above the transport, with
                    the time opposite it. Set near the body copy's size (the
                    description section is 1.15rem) rather than a caption size,
                    because in the feed this line is the only thing naming the
                    reel. */}
                {feedLook && (shownCaption || duration > 0) && (
                  <div
                    ref={titleRow}
                    className={`pointer-events-none absolute bottom-14 z-20 flex items-end justify-between gap-6 ${
                      // Filling the screen, the title starts where the play
                      // GLYPH does and the seconds end where the speaker's
                      // does — 22px in, the 12px bar inset plus the 10px the
                      // 20px marks sit inside their 40px buttons. Two lines
                      // for everything, rather than a third pair of edges.
                      fillLook ? 'left-[1.375rem] right-[1.375rem]' : 'inset-x-5'
                    }`}
                  >
                    {shownCaption ? (
                      <p className="max-w-[26ch] text-[1.05rem] font-medium leading-[1.45] text-white">
                        {shownCaption}
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
                    className={`flex shrink-0 items-center justify-center ${
                      feedLook ? 'size-10' : 'size-8'
                    }`}
                  >
                    {playing ? (
                      <PauseIcon size={feedLook ? 20 : 16} />
                    ) : (
                      <PlayIcon size={feedLook ? 20 : 16} />
                    )}
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
                    onClick={() => {
                      const off = !muted
                      setMuted(off)
                      onSoundOff?.(off)
                    }}
                    aria-label={muted ? t('unmute') : t('mute')}
                    className={`flex shrink-0 items-center justify-center ${
                      feedLook ? 'size-10' : 'size-8'
                    }`}
                  >
                    <SoundIcon muted={muted} size={feedLook ? 20 : 16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </div>
        {grown && playlist && cursor < playlist.length - 1 && <CoverSlide poster={playlist[cursor + 1]?.poster} />}
      </div>
    </div>
  )
}
