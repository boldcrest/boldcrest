'use client'

import { useTranslations } from 'next-intl'

import { useState, useEffect, useRef, useCallback, Children } from 'react'
import { flushSync } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Script from 'next/script'
import { submitProjectForm } from './actions'
import { botReply, greeting } from './replies'
import { trackLead, newMetaEventId } from '@/lib/analytics'
// Global `window.turnstile` type comes from src/types/turnstile.d.ts.

// Only set once the Cloudflare Turnstile widget has been created (see
// lib/turnstile.ts) — until then the widget simply doesn't render and
// verification is skipped server-side, same graceful-degradation pattern as
// the Resend API key. Rendered explicitly (not the declarative `.cf-turnstile`
// div) since this flow has no native <form> to auto-attach the response
// field to — the resulting token is captured in state and attached manually
// in handleSubmit instead.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

/**
 * Single source of truth for "is this a usable email address".
 *
 * Both ways of leaving the email step — the OK button AND the Enter key — must
 * use THIS regex. They used to disagree: the button tested the pattern but Enter
 * only tested `.trim()` (non-empty), so hitting Return with e.g. "aldo" advanced
 * happily. The malformed address then failed BOTH downstream integrations at
 * submit time — ClickUp `400 Value is not a valid email` and Resend `422 Invalid
 * reply_to` — while the visitor still saw the success state, silently losing the
 * lead. (Observed in production 2026-08-31.)
 */
const EMAIL_RE = /^\S+@\S+\.\S+$/

/* ════════════════════════════════════════════════════
   Types & data
══════════════════════════════════════════════════════ */
type Answers = {
  name: string
  position: string
  company: string
  services: string[]
  message: string
  kickoff: string
  deadline: string
  budget: string
  email: string
  source: string[]
}


/* Option values stay ENGLISH in state: they are the stable identifiers that
   Megi's reply map is keyed by, and they are what gets emailed to the team.
   Only the rendered label is translated. */
const OPTION_KEY: Record<string, string> = {
  "Branding": "branding",
  "Packaging design": "packagingDesign",
  "Photography": "photography",
  "Videography": "videography",
  "TV commercials": "tvCommercials",
  "Social media": "socialMedia",
  "Website": "website",
  "Other": "other",
  "ASAP, within the next two weeks.": "asapWithinTheNextTwoWeeks",
  "Soon, next month would be great.": "soonNextMonthWouldBeGreat",
  "Within the next 3 months.": "withinTheNext3Months",
  "No rush. Whenever fits your team.": "noRushWheneverFitsYourTeam",
  "Within 3 months.": "within3Months",
  "Within 6 months.": "within6Months",
  "In about a year.": "inAboutAYear",
  "Open-ended, quality over speed.": "openendedQualityOverSpeed",
  "Under €5,000": "under5000",
  "€5,000 – €15,000": "500015000",
  "€15,000 – €50,000": "1500050000",
  "€50,000+": "50000",
  "Not sure yet, let's figure it out.": "notSureYetLetsFigureItOut",
  "A client referral": "aClientReferral",
  "A friend or colleague": "aFriendOrColleague",
  "I've been following BoldCrest for a while": "iveBeenFollowingBoldcrestForAWhile",
  "Somewhere else": "somewhereElse",
  "Perfect": "perfect",
  "Love that": "loveThat",
  "Great": "great",
  "Got it": "gotIt",
  "Nice": "nice",
  "an identity people actually remember is our happy place.": "anIdentityPeopleActuallyRememberIs",
  "shelf presence is where we have the most fun.": "shelfPresenceIsWhereWeHaveTheMostF",
  "we will make sure it looks every bit the part.": "weWillMakeSureItLooksEveryBitThePa",
  "motion is one of our favourite ways to tell a story.": "motionIsOneOfOurFavouriteWaysToTel",
  "big screen, bigger ideas, count us in.": "bigScreenBiggerIdeasCountUsIn",
  "we will keep your feed worth the follow.": "weWillKeepYourFeedWorthTheFollow",
  "a site that works as hard as it looks, done.": "aSiteThatWorksAsHardAsItLooksDone",
  "tell us a little more and we will shape it together.": "tellUsALittleMoreAndWeWillShapeItT",
  "we like momentum just as much as you do.": "weLikeMomentumJustAsMuchAsYouDo",
  "that gives us room to start it right.": "thatGivesUsRoomToStartItRight",
  "a healthy runway to do this properly.": "aHealthyRunwayToDoThisProperly",
  "good work rarely likes being rushed.": "goodWorkRarelyLikesBeingRushed",
  "tight but very doable, we like the pace.": "tightButVeryDoableWeLikeThePace",
  "plenty of space to get it right.": "plentyOfSpaceToGetItRight",
  "room to be properly ambitious.": "roomToBeProperlyAmbitious",
  "our favourite kind of brief.": "ourFavouriteKindOfBrief",
  "we will make every euro pull its weight.": "weWillMakeEveryEuroPullItsWeight",
  "a solid base to build something sharp.": "aSolidBaseToBuildSomethingSharp",
  "now we have room to get ambitious.": "nowWeHaveRoomToGetAmbitious",
  "this is where we do our best work.": "thisIsWhereWeDoOurBestWork",
  "no problem, we will shape it around the work.": "noProblemWeWillShapeItAroundTheWor",
  "always the best kind of introduction.": "alwaysTheBestKindOfIntroduction",
  "good people talk, and we appreciate it.": "goodPeopleTalkAndWeAppreciateIt",
  "glad the search sent you our way.": "gladTheSearchSentYouOurWay",
  "glad the feed did its job.": "gladTheFeedDidItsJob",
  "that genuinely means a lot.": "thatGenuinelyMeansALot",
  "however you found us, we are glad you did.": "howeverYouFoundUsWeAreGladYouDid",
  "sounds good, let us keep going.": "soundsGoodLetUsKeepGoing",
  "Hi there 👋": "hiThere",
  "Hey there 👋": "heyThere",
  "Hello 👋": "hello",
  "Hi 👋": "hi",
  "Hey 👋": "hey",
  "Nice to meet you, Megi!": "niceToMeetYouMegi",
  "Hey Megi, great to meet you!": "heyMegiGreatToMeetYou",
  "Lovely to meet you, Megi!": "lovelyToMeetYouMegi",
  "Good to meet you, Megi!": "goodToMeetYouMegi",
  "Pleasure to meet you, Megi!": "pleasureToMeetYouMegi",
  "The pleasure is mine, {name}.": "thePleasureIsMineName",
  "Great to have you here, {name}.": "greatToHaveYouHereName",
  "Wonderful to meet you, {name}.": "wonderfulToMeetYouName",
  "Lovely to have you, {name}.": "lovelyToHaveYouName",
  "Brilliant, thanks {name}.": "brilliantThanksName",
  "How can we help?": "howCanWeHelp",
  "So, how can we help?": "soHowCanWeHelp",
  "What can we do for you?": "whatCanWeDoForYou",
  "Where can we jump in?": "whereCanWeJumpIn",
  "Talk soon, {name} 🤝": "talkSoonName",
  "Speak soon, {name} 🤝": "speakSoonName",
  "Chat soon, {name} 🤝": "chatSoonName",
  "Catch you soon, {name} 🤝": "catchYouSoonName",
  "Until next time, {name} 🤝": "untilNextTimeName",
  "Thanks {name}.": "thanksName",
  "Founder": "founder",
  "Build a brand that doesn't fade with the trend cycle.": "buildABrandThatDoesntFadeWithTheTr",
  "Google": "google",
  "Acme Co.": "acmeCo"
}

function useOptionLabel() {
  const tc = useTranslations('Chat')
  const t = useTranslations('Chat')
  return (value: string) => {
    const key = OPTION_KEY[value]
    return key ? tc(key) : value
  }
}

const SERVICE_OPTIONS = [
  'Branding',
  'Packaging design',
  'Photography',
  'Videography',
  'TV commercials',
  'Social media',
  'Website',
  'Other',
]

const KICKOFF_OPTIONS = [
  'ASAP, within the next two weeks.',
  'Soon, next month would be great.',
  'Within the next 3 months.',
  'No rush. Whenever fits your team.',
]

const DEADLINE_OPTIONS = [
  'Within 3 months.',
  'Within 6 months.',
  'In about a year.',
  'Open-ended, quality over speed.',
]

const BUDGET_OPTIONS = [
  'Under €5,000',
  '€5,000 – €15,000',
  '€15,000 – €50,000',
  '€50,000+',
  'Not sure yet, let\'s figure it out.',
]

const SOURCE_OPTIONS = [
  'A client referral',
  'A friend or colleague',
  'Google',
  'Social media',
  'I\'ve been following BoldCrest for a while',
  'Somewhere else',
]

const EMPTY: Answers = {
  name: '',
  position: '',
  company: '',
  services: [],
  message: '',
  kickoff: '',
  deadline: '',
  budget: '',
  email: '',
  source: [],
}

/* ════════════════════════════════════════════════════
   Layout primitives
══════════════════════════════════════════════════════ */
// Each message pops in with a small opacity + translateY on a gentle spring, so
// bubbles land like real chat messages (a touch of settle, never mechanical).
const turnTransition = { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }
const ITEM_TRANSITION = {
  type: 'spring' as const,
  stiffness: 190,
  damping: 24,
  mass: 1.1,
  opacity: { duration: 0.55 },
}
// The avatar slides — not snaps — to the bottom of its group as messages arrive.
const AVATAR_TRANSITION = { type: 'spring' as const, stiffness: 280, damping: 28, mass: 1.1 }

// Conversation pacing — deliberately unhurried so it reads like a real
// back-and-forth: each line lands, settles, and gives you time to read it
// before the next arrives. Same values drive every platform (one shared
// component — desktop, iPad and mobile animate identically). REVEAL_INTERVAL is
// the gap between consecutive messages within a turn; AGENCY_START / USER_START
// delay each side's turn so the conversation breathes between speakers.
const REVEAL_INTERVAL = 1500
const AGENCY_START = 600
// Deliberately a long beat after the account manager finishes before the user's
// reply begins, so the exchange feels like real back-and-forth (you get time to
// read Megi before "you" answer) rather than an instant echo.
const USER_START = 3800

// Reveals a turn's children one-by-one on a timeline so the chat grows like a
// real conversation: messages arrive in sequence, the container expands, and
// the avatar (rendered after the messages) is pushed down as each new one
// appears. Returns how many children are currently shown. Kept brisk so it
// reads like texting, never slow.
function useRevealCount(total: number, startDelayMs: number, intervalMs: number) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 0; i < total; i++) {
      timers.push(
        setTimeout(() => setCount((c) => (c < i + 1 ? i + 1 : c)), startDelayMs + i * intervalMs),
      )
    }
    return () => timers.forEach((t) => clearTimeout(t))
  }, [total, startDelayMs, intervalMs])
  return count
}

/* iOS Safari's scrollIntoView is unreliable for an element inside a
   position:fixed + overflow:auto container (it often scrolls the page instead
   of the inner scroller, or nothing). So we scroll the known scroll container
   — the [data-lenis-prevent] chat body — by a computed offset instead. */
function getScroller(el: HTMLElement): HTMLElement | null {
  return el.closest('[data-lenis-prevent]')
}

/* DESKTOP detection (mouse / trackpad = fine pointer). On desktop there is no
   on-screen keyboard, so ALL the keyboard-aware scroll helpers below
   (FormShell mount-scroll, input/textarea focus-scroll, the visualViewport
   resize handler) must NOT run — they each scroll the active FORM into view,
   which parks the view ~100px short of the true bottom and permanently breaks
   useStickToBottom's pin (it reads that gap as "user scrolled up"). On desktop,
   useStickToBottom is the SOLE scroll authority: it follows every reveal/reflow
   and never leaves the newest line below the fold. Touch (coarse pointer) runs
   every helper exactly as before — mobile is completely unaffected. */
function isFinePointer(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: fine)').matches
  )
}

/** Keep the focused field clear of the on-screen keyboard by scrolling the chat
    body so the field's BOTTOM lands just above the top of the keyboard. The
    keyboard top comes straight from window.visualViewport (offsetTop + height),
    so this is correct whether or not the panel itself shrinks to fit. A generous
    bottom padding gives even the last field room to rise above the keyboard.
    When the keyboard is closed it clears the padding and leaves the view alone,
    so the conversation settles back at the bottom naturally. */
function scrollIntoSafeView(el: HTMLElement, behavior: ScrollBehavior = 'smooth') {
  const scroller = getScroller(el)
  if (!scroller) {
    el.scrollIntoView({ behavior, block: 'center' })
    return
  }
  // Lift the WHOLE active user turn above the keyboard — the form box, its OK
  // button AND the avatar beneath it (so the user's profile picture isn't
  // cropped). Fall back to the form box, then the field itself.
  const box =
    (el.closest('[data-turn]') as HTMLElement | null) ??
    (el.closest('[data-active]') as HTMLElement | null) ??
    el
  const vv = window.visualViewport
  // getBoundingClientRect is relative to the VISIBLE viewport (a fixed element
  // pinned to the visible top reports rect.top ≈ 0 even when the browser has
  // panned the page, i.e. visualViewport.offsetTop > 0). So the keyboard's top
  // edge in that same coordinate space is simply vv.height — NOT
  // offsetTop + vv.height. Using the latter made `keyboard` compute to 0 on
  // devices that pan (offsetTop>0), so the field was never scrolled clear.
  const kbTop = vv ? vv.height : window.innerHeight
  const keyboard = vv ? Math.max(0, window.innerHeight - vv.height) : 0
  if (keyboard < 100) {
    // No overlay keyboard: either it's closed, or the browser resized the layout
    // instead of overlaying (some Android configs). Clear the padding and just
    // make sure the box is visible — ensureVisibleInScroller only scrolls when
    // it isn't, so a desktop view that's already fine is never yanked.
    scroller.style.paddingBottom = ''
    ensureVisibleInScroller(box, behavior)
    return
  }
  // Room below the content so a field near the bottom can still scroll up clear
  // of the keyboard.
  scroller.style.paddingBottom = `${keyboard + 96}px`
  const margin = 20
  const rect = box.getBoundingClientRect()
  // Land the box's bottom a small margin above the keyboard.
  const delta = rect.bottom - (kbTop - margin)
  if (Math.abs(delta) > 1) scroller.scrollTo({ top: scroller.scrollTop + delta, behavior })
}

/** Only scroll if the element isn't fully visible — keeps step changes from
    yanking the layout when everything already fits at full panel height. */
function ensureVisibleInScroller(
  el: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
  pad = 16,
) {
  const scroller = getScroller(el)
  if (!scroller) {
    el.scrollIntoView({ behavior, block: 'nearest' })
    return
  }
  const sRect = scroller.getBoundingClientRect()
  const tRect = el.getBoundingClientRect()
  if (tRect.bottom > sRect.bottom - pad) {
    scroller.scrollTo({ top: scroller.scrollTop + (tRect.bottom - sRect.bottom) + pad, behavior })
  } else if (tRect.top < sRect.top + pad) {
    scroller.scrollTo({ top: scroller.scrollTop - (sRect.top - tRect.top) - pad, behavior })
  }
}

/* Follow the conversation down to a turn's AVATAR (the profile pic at the
   bottom of the group) — not the messages — plus a little padding, so the
   newest line always sits just above the pic. Runs as each message reveals
   (count changes). Skipped while a field is focused, since keyboard scrolling
   owns the view then. Works on every platform (desktop/iPad/mobile). */
function useFollowAvatar(ref: { current: HTMLDivElement | null }, count: number) {
  useEffect(() => {
    if (count === 0 || !ref.current) return
    // DESKTOP ONLY (fine pointer) uses a continuous pin-to-bottom
    // (useStickToBottom) that follows the conversation through reveals AND
    // reflows, so this reactive per-turn follow — which lags on desktop and
    // leaves the newest question/options below the fold, then jumps late — is
    // skipped there. Touch keeps it exactly as before (mobile is unaffected).
    if (isFinePointer()) return
    const ae = document.activeElement
    if (ae instanceof HTMLInputElement || ae instanceof HTMLTextAreaElement) return
    const el = ref.current
    // Track the avatar EVERY frame while its layout-spring runs (~560ms), rather
    // than scrolling once now and once after it settles. The avatar slides DOWN
    // as each new message lands; framer animates that with a transform, so
    // getBoundingClientRect reports its live mid-slide position. Nudging the
    // scroller instantly (behavior 'auto') on each of those frames keeps the
    // avatar pinned just above the fold the whole way down — the page rises in
    // lock-step with it instead of lagging a beat behind, then jumping to catch
    // up. The avatar's own spring still supplies the smooth motion. We run a
    // little past the spring duration so the final resting position is settled.
    let raf = 0
    const startedAt = performance.now()
    const tick = (now: number) => {
      ensureVisibleInScroller(el, 'auto', 40)
      if (now - startedAt < 640) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ref, count])
}

/* DESKTOP ONLY (fine pointer): continuously keep the scroller pinned to the
   bottom as the conversation reveals, the avatars spring, and the identity form
   collapses into the services step — so the newest account-manager line +
   options stay in view (no lag below the fold) and selecting an option never
   triggers a late catch-up jump. A no-op while content still fits (scrollHeight
   === clientHeight) so SHORT conversations stay TOP-anchored — start from the
   top, scroll only once it overflows. Stickiness is tracked from the user's own
   scrolls: a freshly-revealed message can add >100px below the fold, which must
   NOT read as "scrolled up" — so we remember whether they were at the bottom and
   keep them there; scrolling UP detaches (read history), scrolling back
   re-attaches. Touch devices never run this (matchMedia gate) — their
   keyboard-aware logic is untouched. */
function useStickToBottom(
  ref: { current: HTMLElement | null },
  resumeKey: unknown,
) {
  // `stick` (follow-the-bottom) and the scroller live in refs so the resume
  // effect below can re-attach the follow without tearing down the listeners.
  const stickRef = useRef(true)
  const scrollerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (!isFinePointer()) return
    const scroller = root.closest('[data-lenis-prevent]') as HTMLElement | null
    if (!scroller) return
    scrollerRef.current = scroller
    // Stop Chrome's scroll-anchoring from nudging scrollTop as each message
    // reveals. Those nudges fire `scroll` events with no user behind them; the
    // old code read one (gap just over its threshold) as "user scrolled up",
    // latched stick=false, and the pin stranded the view above the newest line
    // with no way back. Desktop-only (this hook returns early on coarse pointer),
    // so mobile's scroller is untouched.
    const prevAnchor = scroller.style.overflowAnchor
    scroller.style.overflowAnchor = 'none'

    // stickRef = follow the bottom. It is flipped ONLY by genuine user scroll
    // input (wheel / touchpad / touch), never by generic `scroll` events — those
    // also fire for our own pin() and for reveal reflow, which is what made the
    // old scroll-event approach race and detach on its own. The ResizeObserver
    // re-pins on every content change while stick holds.
    const atBottom = () =>
      scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 160
    const pin = () => {
      if (stickRef.current) scroller.scrollTop = scroller.scrollHeight
    }
    // wheel fires before the scroll lands, so settle a frame, then decide: a
    // scroll UP detaches (read history / see a long option list); returning to
    // the bottom re-attaches, and advancing the flow re-attaches too (below).
    const onIntent = () => requestAnimationFrame(() => { stickRef.current = atBottom() })

    pin()
    scroller.addEventListener('wheel', onIntent, { passive: true })
    scroller.addEventListener('touchmove', onIntent, { passive: true })
    const ro = new ResizeObserver(pin)
    ro.observe(root)
    return () => {
      scroller.style.overflowAnchor = prevAnchor
      scroller.removeEventListener('wheel', onIntent)
      scroller.removeEventListener('touchmove', onIntent)
      ro.disconnect()
      scrollerRef.current = null
    }
  }, [ref])

  // Advancing the flow (resumeKey changes) RE-ATTACHES the follow. Scrolling up
  // to read history or to see every option in a tall list detaches it — but the
  // moment you make a choice and move on, the conversation should track Megi's
  // new replies + avatar to the bottom again instead of staying stranded where
  // you'd scrolled. Snap to the bottom now; the ResizeObserver then follows each
  // reveal as it lands. Desktop-only.
  useEffect(() => {
    if (!isFinePointer()) return
    stickRef.current = true
    const scroller = scrollerRef.current
    if (scroller) {
      requestAnimationFrame(() => {
        if (stickRef.current) scroller.scrollTop = scroller.scrollHeight
      })
    }
  }, [resumeKey])
}

/* Megi's avatar — profile photo from /public, falls back to the red "M"
   monogram if the image is missing so it never renders as a broken image. */
function MegiAvatar() {
  const [imgOk, setImgOk] = useState(true)
  return (
    <div
      className="mt-4 h-10 w-10 overflow-hidden rounded-full"
      style={{ background: '#161616' }}
    >
      {imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/Megi.jpg"
          alt="Megi"
          className="h-full w-full object-cover"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-[0.85rem] font-bold"
          style={{ color: '#545454' }}
        >
          M
        </div>
      )}
    </div>
  )
}

function AgencyTurn({
  children,
  startDelay = AGENCY_START,
}: {
  children: React.ReactNode
  startDelay?: number
}) {
  const tc = useTranslations('Chat')
  const items = Children.toArray(children)
  const count = useRevealCount(items.length, startDelay, REVEAL_INTERVAL)
  const avatarRef = useRef<HTMLDivElement>(null)
  useFollowAvatar(avatarRef, count)
  // Render nothing until the first message is due so the turn takes no space
  // (and no surrounding gap) and the chat grows naturally from the top down.
  if (count === 0) return null
  return (
    <div className="flex w-full flex-col items-start">
      <div className="max-w-[560px]">
        <header className="mb-4 flex items-baseline gap-3">
          <h3 className="font-display text-[1.05rem] font-bold tracking-[-0.01em] text-text-primary">
            Megi
          </h3>
          <span className="text-[0.8rem] text-text-tertiary">
            {tc('accountManager')}
          </span>
        </header>
        {/* Messages mount one at a time; the avatar below is pushed down as
            each new one appears, like a real chat message group. */}
        <div className="flex flex-col items-start gap-2">{items.slice(0, count)}</div>
        <motion.div ref={avatarRef} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={AVATAR_TRANSITION}>
          <MegiAvatar />
        </motion.div>
      </div>
    </div>
  )
}

function UserTurn({
  heading,
  initial,
  children,
  startDelay = USER_START,
}: {
  heading: string
  initial?: string
  children: React.ReactNode
  startDelay?: number
}) {
  const items = Children.toArray(children)
  const count = useRevealCount(items.length, startDelay, REVEAL_INTERVAL)
  const avatarRef = useRef<HTMLDivElement>(null)
  useFollowAvatar(avatarRef, count)
  // The user's turn starts only after the account-manager messages above have
  // landed, so the exchange reads as a back-and-forth. Hidden until then.
  if (count === 0) return null
  return (
    <div className="flex w-full flex-col items-end">
      <div data-turn className="flex w-full max-w-[560px] flex-col items-end">
        <header className="mb-4 flex items-baseline gap-3">
          <h3 className="font-display text-[1.05rem] font-bold tracking-[-0.01em] text-text-primary">
            {heading}
          </h3>
        </header>
        <div className="flex w-full flex-col items-end gap-2">{items.slice(0, count)}</div>
        <motion.div
          ref={avatarRef}
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={AVATAR_TRANSITION}
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-full text-[0.85rem] font-bold"
          style={{ background: '#161616', color: '#545454' }}
        >
          {initial || 'Y'}
        </motion.div>
      </div>
    </div>
  )
}

function Bubble({
  side = 'left',
  children,
}: {
  side?: 'left' | 'right'
  children: React.ReactNode
}) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={ITEM_TRANSITION}
      className={`rounded-2xl px-5 py-3 text-[0.95rem] leading-[1.5] ${
        side === 'left'
          ? 'rounded-bl-md bg-bg-card text-text-primary'
          : 'rounded-br-md bg-[#1a1a1a] text-text-primary'
      }`}
    >
      {children}
    </motion.p>
  )
}

/* ════════════════════════════════════════════════════
   Form-bubble shells
══════════════════════════════════════════════════════ */
function FormShell({
  children,
  active,
}: {
  children: React.ReactNode
  active: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Desktop: useStickToBottom owns the scroll — this form-aligned scroll would
    // park ~100px short of bottom and break its pin. Touch keeps it (keyboard).
    if (isFinePointer()) return
    if (ref.current) ensureVisibleInScroller(ref.current)
  }, [])
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: active ? 1 : 0.5, y: 0 }}
      transition={ITEM_TRANSITION}
      data-active={active || undefined}
      className="w-full scroll-mt-6 rounded-2xl rounded-br-md border p-5 transition-colors duration-300"
      style={{
        background: '#141414',
        borderColor: active ? 'rgba(255,255,255,0.12)' : 'var(--border)',
      }}
    >
      {children}
    </motion.div>
  )
}

function OkButton({
  disabled,
  onClick,
  type = 'button',
}: {
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      // Don't let the tap steal focus from the input — keeps the keyboard up so
      // advanceText() can move focus to the next field (iOS).
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="mt-4 inline-flex items-center gap-2 self-end rounded-full px-5 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.18em] transition-all duration-300 enabled:hover:translate-x-0.5 disabled:cursor-not-allowed disabled:opacity-30"
      style={{ background: '#545454', color: '#fff' }}
    >
      Ok
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

/* ════════════════════════════════════════════════════
   Step inputs
══════════════════════════════════════════════════════ */
function InlineInput({
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  type = 'text',
  active,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  type?: 'text' | 'email'
  active: boolean
}) {
  // No auto-focus: the keyboard must only open when the user taps the field.
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
        {label}
      </span>
      <div className="flex items-center gap-3 border-b border-white/15 pb-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            // Desktop has no keyboard — let useStickToBottom own the scroll so
            // focusing a field never fights the pin. Touch keeps the
            // keyboard-clearing scroll below (mobile unchanged).
            if (isFinePointer()) return
            // Scroll the focused INPUT into view (not the whole form shell) so
            // the field stays visible as the identity form grows downward and
            // each later field sits lower in it.
            const input = e.currentTarget
            scrollIntoSafeView(input)
            // re-run after the keyboard has finished sliding up (visualViewport
            // settles over ~300ms) so the final position clears it.
            setTimeout(() => scrollIntoSafeView(input, 'auto'), 350)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              e.preventDefault()
              onSubmit()
            }
          }}
          placeholder={placeholder}
          disabled={!active}
          className="w-full bg-transparent text-[1.05rem] text-text-primary outline-none placeholder:text-text-tertiary disabled:cursor-default"
        />
      </div>
    </div>
  )
}

function CheckboxList({
  options,
  value,
  onToggle,
  active,
}: {
  options: string[]
  value: string[]
  onToggle: (v: string) => void
  active: boolean
}) {
  const label = useOptionLabel()
  return (
    <div className="flex flex-col">
      {options.map((opt) => {
        const checked = value.includes(opt)
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-center justify-between gap-4 border-t border-white/8 py-3 text-[0.95rem] transition-colors duration-200 last:border-b ${
              checked ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            } ${active ? '' : 'pointer-events-none'}`}
          >
            <span>{label(opt)}</span>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(opt)}
              disabled={!active}
              className="sr-only"
            />
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                checked ? '' : 'border-white/25'
              }`}
              style={checked ? { background: '#545454', borderColor: '#545454' } : undefined}
              aria-hidden="true"
            >
              {checked && (
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6.5l2.4 2.4L9.5 4"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function RadioList({
  options,
  value,
  onPick,
  active,
}: {
  options: string[]
  value: string
  onPick: (v: string) => void
  active: boolean
}) {
  const label = useOptionLabel()
  return (
    <div className="flex flex-col">
      {options.map((opt) => {
        const checked = value === opt
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-center justify-between gap-4 border-t border-white/8 py-3 text-[0.95rem] transition-colors duration-200 last:border-b ${
              checked ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'
            } ${active ? '' : 'pointer-events-none'}`}
          >
            <span>{label(opt)}</span>
            <input
              type="radio"
              checked={checked}
              onChange={() => onPick(opt)}
              disabled={!active}
              className="sr-only"
            />
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                checked ? '' : 'border-white/25'
              }`}
              style={checked ? { borderColor: '#545454' } : undefined}
              aria-hidden="true"
            >
              {checked && (
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: '#545454' }}
                />
              )}
            </span>
          </label>
        )
      })}
    </div>
  )
}

/* ════════════════════════════════════════════════════
   Main client
══════════════════════════════════════════════════════ */
type Step =
  | 'name'
  | 'position'
  | 'company'
  | 'services'
  | 'message'
  | 'kickoff'
  | 'deadline'
  | 'budget'
  | 'email'
  | 'source'
  | 'submitting'
  | 'sent'

const ORDER: Step[] = [
  'name',
  'position',
  'company',
  'services',
  'message',
  'kickoff',
  'deadline',
  'budget',
  'email',
  'source',
  'submitting',
  'sent',
]

export default function StartProjectChat() {
  const tc = useTranslations('Chat')
  const [step, setStep] = useState<Step>('name')
  const [a, setA] = useState<Answers>(EMPTY)
  // One random seed per conversation, fixed for its lifetime, so the greeting /
  // welcome / sign-off variants (see replies.ts) read differently each visit but
  // never change across the reveal animation or re-renders. Restarting the chat
  // remounts this component → fresh seed → fresh phrasing. Generated in a state
  // initializer (client-only — the panel only mounts after open), so it never
  // re-rolls and there's no SSR/hydration mismatch.
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000))
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Anti-spam — see src/lib/spam-guard.ts and src/lib/turnstile.ts for the
  // server-side checks these feed. mountedAt captures fill-time from the
  // moment the chat opens; honeypot is a field no real visitor ever
  // populates; turnstileToken is filled asynchronously by the widget below
  // (Invisible mode resolves in the background — the multi-step conversation
  // gives it far longer than it needs before submit).
  const [mountedAt] = useState(() => Date.now())
  const [honeypot, setHoneypot] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const turnstileElRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetId = useRef<string>('')

  const renderTurnstile = useCallback(() => {
    if (!TURNSTILE_SITE_KEY || !window.turnstile || !turnstileElRef.current) return
    if (turnstileWidgetId.current) return // already rendered
    turnstileWidgetId.current = window.turnstile.render(turnstileElRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: 'dark',
      callback: (token) => setTurnstileToken(token),
      'error-callback': () => setTurnstileToken(''),
      'expired-callback': () => setTurnstileToken(''),
    })
  }, [])
  // Desktop: follow the conversation by keeping the newest line pinned to the
  // bottom. Passing `step` re-attaches the follow each time the flow advances,
  // so scrolling up (to read history or see a long option list) never strands
  // the conversation once you make a choice and move on.
  useStickToBottom(containerRef, step)

  // Keep the *active* form comfortably in view. Centering it (rather than
  // scrolling to the very bottom) ensures the field you're typing in never
  // ends up hidden behind the on-screen keyboard on mobile — the keyboard only
  // opens on the text-input steps, and those forms are short, so centering them
  // leaves the question above visible and the input clear of the keyboard.
  const scrollActiveIntoView = useCallback(
    (behavior: ScrollBehavior, mode: 'center' | 'nearest') => {
      const root = containerRef.current
      if (!root) return
      // Prefer the focused field (it may sit low in a growing form), then the
      // active form, then the conversation bottom once everything's sent.
      const ae = document.activeElement
      const focusedField =
        root.contains(ae) && (ae instanceof HTMLInputElement || ae instanceof HTMLTextAreaElement)
          ? (ae as HTMLElement)
          : null
      const target =
        focusedField ??
        root.querySelector<HTMLElement>('[data-active]') ??
        bottomRef.current
      if (!target) return
      if (mode === 'center') scrollIntoSafeView(target, behavior)
      else ensureVisibleInScroller(target, behavior)
    },
    [],
  )

  const isActive = (s: Step) => step === s
  const isPast = (s: Step) => ORDER.indexOf(step) > ORDER.indexOf(s)
  const isReached = (s: Step) => ORDER.indexOf(step) >= ORDER.indexOf(s)

  const advance = () => {
    const idx = ORDER.indexOf(step)
    if (idx < ORDER.length - 1) setStep(ORDER[idx + 1])
  }

  // Advance from a TEXT field (name → position → company, email) without losing
  // the keyboard. On iOS, disabling the field you just left blurs it and closes
  // the keyboard; the only way to keep it open is to move focus to the next text
  // input within the SAME user gesture. flushSync commits the step change so the
  // next field is in the DOM, then we focus it synchronously. If the next step
  // has no text field (e.g. the checkbox/radio steps), nothing is focused and
  // the keyboard closes naturally — which is the desired behaviour there.
  const advanceText = () => {
    const ae = document.activeElement
    const wasTyping = ae instanceof HTMLInputElement || ae instanceof HTMLTextAreaElement
    flushSync(() => advance())
    if (!wasTyping) return
    const root = containerRef.current
    const next = root?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      '[data-active] input:not([disabled]), [data-active] textarea:not([disabled])',
    )
    // DESKTOP: preventScroll is essential. The next field sits lower in the
    // growing form, so a default focus() makes the browser scrollIntoView it —
    // and that scroll bubbles up THROUGH the inner chat scroller INTO the fixed
    // panel itself (overflow-hidden still scrolls programmatically), shoving the
    // header and conversation off the top and leaving a huge void.
    // useStickToBottom owns desktop scrolling, so the browser must not scroll on
    // focus. TOUCH is left exactly as before — plain focus() keeps the iOS
    // keyboard-retention flow (flushSync + focus-next) untouched; its own
    // keyboard-aware scrollIntoSafeView positions the field. The panel-scroll
    // guard in the provider catches any stray panel scroll on either platform.
    if (isFinePointer()) next?.focus({ preventScroll: true })
    else next?.focus()
  }

  // (Per-message follow-scroll lives on each Bubble/FormShell as it mounts, so
  // the view tracks the conversation as it reveals — no step-level scroll here.)

  // When the on-screen keyboard opens/closes the visual viewport resizes; the
  // panel shrinks to fit above it (see StartProjectProvider), so re-center the
  // active field instantly to keep it clear of the keyboard. No smooth scroll
  // here — it should track the keyboard, not animate after it.
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    // Desktop: no keyboard, so the only vv resize is a window drag — let
    // useStickToBottom handle that. This centring would fight the pin.
    if (isFinePointer()) return
    // Defer two frames so the panel has re-rendered to its new (shorter)
    // height before we measure and scroll — otherwise we'd center against the
    // old full height and the field would still end up under the keyboard.
    const onResize = () => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => scrollActiveIntoView('auto', 'center')),
      )
    }
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [scrollActiveIntoView])

  const handleSubmit = async () => {
    setStep('submitting')
    setSubmitError(null)
    const fd = new FormData()
    // Trim every free-text answer. Validation already tested `.trim()`, but the
    // RAW value was submitted — so " aldo@boldcrest.com " passed the check and
    // was then rejected by Resend/ClickUp for the surrounding whitespace.
    fd.set('name', a.name.trim())
    fd.set('position', a.position.trim())
    fd.set('company', a.company.trim())
    fd.set('email', a.email.trim())
    fd.set('services', a.services.join(', '))
    fd.set('message', a.message.trim())
    fd.set('kickoff', a.kickoff.trim())
    fd.set('deadline', a.deadline.trim())
    fd.set('budget', a.budget.trim())
    fd.set('source', a.source.join(', '))
    fd.set('_gotcha', honeypot)
    fd.set('_ts', String(mountedAt))
    fd.set('cf-turnstile-response', turnstileToken)
    // One id for this submission, shared by the browser pixel and the server's
    // Conversions API call so Meta counts a single Lead. Null when the visitor
    // has not accepted cookies — then neither half reports.
    const metaEventId = newMetaEventId()
    if (metaEventId) fd.set('meta_event_id', metaEventId)

    const res = await submitProjectForm(fd)
    if (res.success) {
      setStep('sent')
      trackLead(
        'start_project',
        {
          services: a.services.join(', '),
          budget: a.budget,
        },
        metaEventId ?? undefined,
      )
    } else {
      // Rare — Invisible mode resolves silently for virtually everyone. Land
      // back on the last question so the visitor can retry rather than get
      // stuck on "Sending…" forever.
      setStep('source')
      setSubmitError(res.error || tc('failed'))
      setTurnstileToken('')
      window.turnstile?.reset(turnstileWidgetId.current)
    }
  }

  const userHeading = (() => {
    const parts: string[] = []
    if (a.name) parts.push(a.name)
    if (a.position) parts.push(a.position)
    let label = parts.join(', ')
    if (a.company) label = label ? `${label} @ ${a.company}` : `@ ${a.company}`
    return label || tc('you')
  })()

  const userInitial = a.name ? a.name.charAt(0).toUpperCase() : 'Y'

  /* ── Identity sub-step gating ── */
  const showIdentity = isReached('name')
  const showIdentityPosition = isReached('position')
  const showIdentityCompany = isReached('company')
  const identitySubmitted = isReached('services')

  return (
    <div ref={containerRef} className="flex flex-col gap-12">
        {TURNSTILE_SITE_KEY && (
          <>
            <Script
              src="https://challenges.cloudflare.com/turnstile/v0/api.js"
              strategy="lazyOnload"
              onLoad={renderTurnstile}
            />
            <div ref={turnstileElRef} />
          </>
        )}
        {/* Honeypot — invisible to real visitors, bots filling every input on
            the rendered page catch themselves here. */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
        />

        {/* ═══════════════════════════════════════════
            Turn 1 — Megi's greeting
        ═══════════════════════════════════════════ */}
        <AgencyTurn>
          <Bubble>{greeting('agencyHello', seed, tc)}</Bubble>
          <Bubble>{tc('imMegi')}</Bubble>
        </AgencyTurn>

        {/* Turn 1 — User identity */}
        <UserTurn heading={userHeading} initial={userInitial}>
          <Bubble side="right">👋</Bubble>
          <Bubble side="right">{greeting('userHello', seed, tc)}</Bubble>

          <FormShell active={showIdentity && !identitySubmitted}>
            <InlineInput
              label={tc('myNameIs')}
              placeholder="Leonard Cohen"
              value={a.name}
              onChange={(v) => setA({ ...a, name: v })}
              onSubmit={() => a.name.trim() && advanceText()}
              active={isActive('name')}
            />
            {!isActive('name') && (
              <div className="mt-4">
                <InlineInput
                  label={tc('imA')}
                  placeholder={tc('founder')}
                  value={a.position}
                  onChange={(v) => setA({ ...a, position: v })}
                  onSubmit={() => a.position.trim() && advanceText()}
                  active={isActive('position')}
                />
              </div>
            )}
            {showIdentityCompany && (
              <div className="mt-4">
                <InlineInput
                  label={tc('at')}
                  placeholder={tc('acmeCo')}
                  value={a.company}
                  onChange={(v) => setA({ ...a, company: v })}
                  onSubmit={() => a.company.trim() && advanceText()}
                  active={isActive('company')}
                />
              </div>
            )}
            {(isActive('name') || isActive('position') || isActive('company')) && (
              <div className="flex justify-end">
                <OkButton
                  disabled={
                    (isActive('name') && !a.name.trim()) ||
                    (isActive('position') && !a.position.trim()) ||
                    (isActive('company') && !a.company.trim())
                  }
                  onClick={advanceText}
                />
              </div>
            )}
          </FormShell>
        </UserTurn>

        {/* ═══════════════════════════════════════════
            Turn 2 — Services
        ═══════════════════════════════════════════ */}
        {isReached('services') && (
          <>
            <AgencyTurn>
              <Bubble>{greeting('agencyWelcome', seed, tc, a.name)}</Bubble>
              <Bubble>{greeting('agencyAsk', seed, tc)}</Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('services')}>
                <span className="mb-3 block text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
                  {tc('lookingFor')}
                </span>
                <CheckboxList
                  options={SERVICE_OPTIONS}
                  value={a.services}
                  onToggle={(v) =>
                    setA((prev) => ({
                      ...prev,
                      services: prev.services.includes(v)
                        ? prev.services.filter((x) => x !== v)
                        : [...prev.services, v],
                    }))
                  }
                  active={isActive('services')}
                />
                {isActive('services') && (
                  <div className="flex justify-end">
                    <OkButton
                      disabled={a.services.length === 0}
                      onClick={advance}
                    />
                  </div>
                )}
              </FormShell>
            </UserTurn>
          </>
        )}

        {/* ═══════════════════════════════════════════
            Turn 3 — Project description
        ═══════════════════════════════════════════ */}
        {isReached('message') && (
          <>
            <AgencyTurn>
              <Bubble>{botReply('services', a.services[0], tc)}</Bubble>
              <Bubble>
                {tc('describe')}
              </Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('message')}>
                <span className="mb-3 block text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
                  {tc('iWantTo')}
                </span>
                <textarea
                  value={a.message}
                  onChange={(e) => setA({ ...a, message: e.target.value })}
                  onFocus={(e) => {
                    // Desktop: useStickToBottom owns the scroll (no keyboard).
                    if (isFinePointer()) return
                    const field = e.currentTarget
                    scrollIntoSafeView(field)
                    setTimeout(() => scrollIntoSafeView(field, 'auto'), 350)
                  }}
                  disabled={!isActive('message')}
                  rows={3}
                  placeholder={tc('buildABrandThatDoesntFadeWith')}
                  className="w-full resize-none border-b border-white/15 bg-transparent pb-2 text-[1.05rem] text-text-primary outline-none placeholder:text-text-tertiary disabled:cursor-default"
                />
                {isActive('message') && (
                  <div className="flex justify-end">
                    <OkButton
                      disabled={!a.message.trim()}
                      onClick={advance}
                    />
                  </div>
                )}
              </FormShell>
            </UserTurn>
          </>
        )}

        {/* ═══════════════════════════════════════════
            Turn 4 — Kickoff timing
        ═══════════════════════════════════════════ */}
        {isReached('kickoff') && (
          <>
            <AgencyTurn>
              <Bubble>{tc('gotIt')}</Bubble>
              <Bubble>{tc('kickoff')}</Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('kickoff')}>
                <span className="mb-3 block text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
                  {tc('weCanStart')}
                </span>
                <RadioList
                  options={KICKOFF_OPTIONS}
                  value={a.kickoff}
                  onPick={(v) => setA({ ...a, kickoff: v })}
                  active={isActive('kickoff')}
                />
                {isActive('kickoff') && (
                  <div className="flex justify-end">
                    <OkButton disabled={!a.kickoff} onClick={advance} />
                  </div>
                )}
              </FormShell>
            </UserTurn>
          </>
        )}

        {/* ═══════════════════════════════════════════
            Turn 5 — Deadline
        ═══════════════════════════════════════════ */}
        {isReached('deadline') && (
          <>
            <AgencyTurn>
              <Bubble>{botReply('kickoff', a.kickoff, tc)}</Bubble>
              <Bubble>{tc('deadline')}</Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('deadline')}>
                <span className="mb-3 block text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
                  {tc('aimingFor')}
                </span>
                <RadioList
                  options={DEADLINE_OPTIONS}
                  value={a.deadline}
                  onPick={(v) => setA({ ...a, deadline: v })}
                  active={isActive('deadline')}
                />
                {isActive('deadline') && (
                  <div className="flex justify-end">
                    <OkButton disabled={!a.deadline} onClick={advance} />
                  </div>
                )}
              </FormShell>
            </UserTurn>
          </>
        )}

        {/* ═══════════════════════════════════════════
            Turn 6 — Budget
        ═══════════════════════════════════════════ */}
        {isReached('budget') && (
          <>
            <AgencyTurn>
              <Bubble>{botReply('deadline', a.deadline, tc)}</Bubble>
              <Bubble>{tc('budget')}</Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('budget')}>
                <span className="mb-3 block text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
                  I&rsquo;d say
                </span>
                <RadioList
                  options={BUDGET_OPTIONS}
                  value={a.budget}
                  onPick={(v) => setA({ ...a, budget: v })}
                  active={isActive('budget')}
                />
                {isActive('budget') && (
                  <div className="flex justify-end">
                    <OkButton disabled={!a.budget} onClick={advance} />
                  </div>
                )}
              </FormShell>
            </UserTurn>
          </>
        )}

        {/* ═══════════════════════════════════════════
            Turn 7 — Email
        ═══════════════════════════════════════════ */}
        {isReached('email') && (
          <>
            <AgencyTurn>
              <Bubble>{botReply('budget', a.budget, tc)}</Bubble>
              <Bubble>{tc('emailAsk')}</Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('email')}>
                <InlineInput
                  label={tc('reachMeAt')}
                  placeholder="leonardcohen@boldcrest.com"
                  value={a.email}
                  type="email"
                  onChange={(v) => setA({ ...a, email: v })}
                  onSubmit={() => EMAIL_RE.test(a.email.trim()) && advance()}
                  active={isActive('email')}
                />
                {isActive('email') && (
                  <div className="flex justify-end">
                    <OkButton
                      disabled={!EMAIL_RE.test(a.email.trim())}
                      onClick={advance}
                    />
                  </div>
                )}
              </FormShell>
            </UserTurn>
          </>
        )}

        {/* ═══════════════════════════════════════════
            Turn 8 — Source
        ═══════════════════════════════════════════ */}
        {isReached('source') && (
          <>
            <AgencyTurn>
              <Bubble>{tc('thanksName').replace('{name}', a.name.trim().split(/\s+/)[0] || 'there')}</Bubble>
              <Bubble>{tc('lastThing')}</Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('source')}>
                <span className="mb-3 block text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
                  {tc('foundThrough')}
                </span>
                <CheckboxList
                  options={SOURCE_OPTIONS}
                  value={a.source}
                  onToggle={(v) =>
                    setA((prev) => ({
                      ...prev,
                      source: prev.source.includes(v)
                        ? prev.source.filter((x) => x !== v)
                        : [...prev.source, v],
                    }))
                  }
                  active={isActive('source')}
                />
                {isActive('source') && (
                  <>
                    {submitError && (
                      <p className="mt-3 text-right text-[0.85rem] text-text-secondary">
                        {submitError}
                      </p>
                    )}
                    <div className="flex justify-end">
                      <OkButton
                        disabled={a.source.length === 0}
                        onClick={handleSubmit}
                      />
                    </div>
                  </>
                )}
              </FormShell>
            </UserTurn>
          </>
        )}

        {/* ═══════════════════════════════════════════
            Sent state
        ═══════════════════════════════════════════ */}
        <AnimatePresence>
          {(step === 'submitting' || step === 'sent') && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={turnTransition}
            >
              <AgencyTurn>
                {step === 'submitting' ? (
                  <Bubble>{tc('sending')}</Bubble>
                ) : (
                  <>
                    <Bubble>{botReply('source', a.source[0], tc)}</Bubble>
                    <Bubble>
                      {tc('received')}
                    </Bubble>
                    <Bubble>
                      {tc('getBack')}
                      <span className="text-white"> {a.email}</span>.
                    </Bubble>
                    <Bubble>{greeting('agencyBye', seed, tc, a.name)}</Bubble>
                  </>
                )}
              </AgencyTurn>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -mt-12 cancels the trailing gap-12 (48px) the flex column would
            otherwise put between the last turn and this 0-height scroll anchor,
            so the conversation sits tight to the chat box bottom. */}
        <div ref={bottomRef} aria-hidden="true" className="-mt-12" />
    </div>
  )
}
