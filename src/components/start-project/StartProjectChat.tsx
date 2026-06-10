'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { submitProjectForm } from './actions'

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
  'ASAP — within the next two weeks.',
  'Soon — next month would be great.',
  'Within the next 3 months.',
  'No rush. Whenever fits your team.',
]

const DEADLINE_OPTIONS = [
  'Within 3 months.',
  'Within 6 months.',
  'In about a year.',
  'Open-ended — quality over speed.',
]

const BUDGET_OPTIONS = [
  'Under €5,000',
  '€5,000 – €15,000',
  '€15,000 – €50,000',
  '€50,000+',
  'Not sure yet — let\'s figure it out.',
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
const turnVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

const turnTransition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }

/* Megi's avatar — profile photo from /public, falls back to the red "M"
   monogram if the image is missing so it never renders as a broken image. */
function MegiAvatar() {
  const [imgOk, setImgOk] = useState(true)
  return (
    <div
      className="mt-4 h-10 w-10 overflow-hidden rounded-full"
      style={{ background: '#DA291C' }}
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
        <div className="flex h-full w-full items-center justify-center text-[0.85rem] font-bold text-white">
          M
        </div>
      )}
    </div>
  )
}

function AgencyTurn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={turnVariants}
      initial="initial"
      animate="animate"
      transition={turnTransition}
      className="flex w-full flex-col items-start"
    >
      <div className="max-w-[560px]">
        <header className="mb-4 flex items-baseline gap-3">
          <h3 className="font-display text-[1.05rem] font-bold tracking-[-0.01em] text-text-primary">
            Megi
          </h3>
          <span className="text-[0.8rem] text-text-tertiary">
            Account Manager
          </span>
        </header>
        <div className="flex flex-col items-start gap-2">{children}</div>
        <MegiAvatar />
      </div>
    </motion.div>
  )
}

function UserTurn({
  heading,
  initial,
  children,
}: {
  heading: string
  initial?: string
  children: React.ReactNode
}) {
  return (
    <motion.div
      variants={turnVariants}
      initial="initial"
      animate="animate"
      transition={turnTransition}
      className="flex w-full flex-col items-end"
    >
      <div className="flex w-full max-w-[560px] flex-col items-end">
        <header className="mb-4 flex items-baseline gap-3">
          <h3 className="font-display text-[1.05rem] font-bold tracking-[-0.01em] text-text-primary">
            {heading}
          </h3>
        </header>
        <div className="flex w-full flex-col items-end gap-2">{children}</div>
        <div
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-full text-[0.85rem] font-bold text-white"
          style={{ background: '#004c95' }}
        >
          {initial || 'You'.slice(0, 1)}
        </div>
      </div>
    </motion.div>
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
    <p
      className={`rounded-2xl px-5 py-3 text-[0.95rem] leading-[1.5] ${
        side === 'left'
          ? 'rounded-bl-md bg-bg-card text-text-primary'
          : 'rounded-br-md bg-[#1a1a1a] text-text-primary'
      }`}
    >
      {children}
    </p>
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
  return (
    <div
      className={`w-full rounded-2xl rounded-br-md border p-5 transition-opacity duration-300 ${
        active ? 'opacity-100' : 'opacity-50'
      }`}
      style={{
        background: '#141414',
        borderColor: active ? 'rgba(255,255,255,0.12)' : 'var(--border)',
      }}
    >
      {children}
    </div>
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
      onClick={onClick}
      className="mt-4 inline-flex items-center gap-2 self-end rounded-full px-5 py-2 text-[0.8rem] font-semibold uppercase tracking-[0.18em] transition-all duration-300 enabled:hover:translate-x-0.5 disabled:cursor-not-allowed disabled:opacity-30"
      style={{ background: '#DA291C', color: '#fff' }}
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
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (active && ref.current) ref.current.focus()
  }, [active])
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
        {label}
      </span>
      <div className="flex items-center gap-3 border-b border-white/15 pb-2">
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
            <span>{opt}</span>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(opt)}
              disabled={!active}
              className="sr-only"
            />
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                checked ? 'bg-accent text-bg' : 'border-white/25'
              }`}
              style={checked ? { background: '#DA291C', borderColor: '#DA291C' } : undefined}
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
            <span>{opt}</span>
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
              style={checked ? { borderColor: '#DA291C' } : undefined}
              aria-hidden="true"
            >
              {checked && (
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: '#DA291C' }}
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
  const [step, setStep] = useState<Step>('name')
  const [a, setA] = useState<Answers>(EMPTY)
  const bottomRef = useRef<HTMLDivElement>(null)

  const isActive = (s: Step) => step === s
  const isPast = (s: Step) => ORDER.indexOf(step) > ORDER.indexOf(s)
  const isReached = (s: Step) => ORDER.indexOf(step) >= ORDER.indexOf(s)

  const advance = () => {
    const idx = ORDER.indexOf(step)
    if (idx < ORDER.length - 1) setStep(ORDER[idx + 1])
  }

  // Auto-scroll new content into view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [step])

  const handleSubmit = async () => {
    setStep('submitting')
    const fd = new FormData()
    fd.set('name', a.name)
    fd.set('position', a.position)
    fd.set('company', a.company)
    fd.set('email', a.email)
    fd.set('services', a.services.join(', '))
    fd.set('message', a.message)
    fd.set('kickoff', a.kickoff)
    fd.set('deadline', a.deadline)
    fd.set('budget', a.budget)
    fd.set('source', a.source.join(', '))
    const res = await submitProjectForm(fd)
    if (res.success) setStep('sent')
  }

  const userHeading = (() => {
    const parts: string[] = []
    if (a.name) parts.push(a.name)
    if (a.position) parts.push(a.position)
    let label = parts.join(', ')
    if (a.company) label = label ? `${label} @ ${a.company}` : `@ ${a.company}`
    return label || 'You'
  })()

  const userInitial = a.name ? a.name.charAt(0).toUpperCase() : 'Y'

  /* ── Identity sub-step gating ── */
  const showIdentity = isReached('name')
  const showIdentityPosition = isReached('position')
  const showIdentityCompany = isReached('company')
  const identitySubmitted = isReached('services')

  return (
    <div className="flex flex-col gap-12">
        {/* ═══════════════════════════════════════════
            Turn 1 — Megi's greeting
        ═══════════════════════════════════════════ */}
        <AgencyTurn>
          <Bubble>Hi there 👋</Bubble>
          <Bubble>I&rsquo;m Megi.</Bubble>
        </AgencyTurn>

        {/* Turn 1 — User identity */}
        <UserTurn heading={userHeading} initial={userInitial}>
          <Bubble side="right">👋</Bubble>
          <Bubble side="right">Nice to meet you, Megi!</Bubble>

          <FormShell active={showIdentity && !identitySubmitted}>
            <InlineInput
              label="My name is"
              placeholder="Paul McCartney"
              value={a.name}
              onChange={(v) => setA({ ...a, name: v })}
              onSubmit={() => a.name.trim() && advance()}
              active={isActive('name')}
            />
            {!isActive('name') && (
              <div className="mt-4">
                <InlineInput
                  label="I'm a"
                  placeholder="Founder"
                  value={a.position}
                  onChange={(v) => setA({ ...a, position: v })}
                  onSubmit={() => a.position.trim() && advance()}
                  active={isActive('position')}
                />
              </div>
            )}
            {showIdentityCompany && (
              <div className="mt-4">
                <InlineInput
                  label="at"
                  placeholder="Acme Co."
                  value={a.company}
                  onChange={(v) => setA({ ...a, company: v })}
                  onSubmit={() => a.company.trim() && advance()}
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
                  onClick={advance}
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
              <Bubble>The pleasure is mine, {a.name}.</Bubble>
              <Bubble>How can we help?</Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('services')}>
                <span className="mb-3 block text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
                  I&rsquo;m looking for
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
              <Bubble>You came to the right place.</Bubble>
              <Bubble>
                In a sentence or two — what are you trying to build?
              </Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('message')}>
                <span className="mb-3 block text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
                  I want to&hellip;
                </span>
                <textarea
                  value={a.message}
                  onChange={(e) => setA({ ...a, message: e.target.value })}
                  disabled={!isActive('message')}
                  rows={3}
                  placeholder="Build a brand that doesn't fade with the trend cycle."
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
              <Bubble>Got it.</Bubble>
              <Bubble>When would you like to kick this off?</Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('kickoff')}>
                <span className="mb-3 block text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
                  We can start
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
              <Bubble>And when do you want it live?</Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('deadline')}>
                <span className="mb-3 block text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
                  I&rsquo;m aiming for
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
              <Bubble>To wrap up&hellip;</Bubble>
              <Bubble>What budget range did you have in mind?</Bubble>
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
              <Bubble>
                Brilliant — I&rsquo;ll talk this over with the team and get
                back to you.
              </Bubble>
              <Bubble>What&rsquo;s the best email to reach you on?</Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('email')}>
                <InlineInput
                  label="Reach me at"
                  placeholder="aldo@boldcrest.com"
                  value={a.email}
                  type="email"
                  onChange={(v) => setA({ ...a, email: v })}
                  onSubmit={() => a.email.trim() && advance()}
                  active={isActive('email')}
                />
                {isActive('email') && (
                  <div className="flex justify-end">
                    <OkButton
                      disabled={!/^\S+@\S+\.\S+$/.test(a.email.trim())}
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
              <Bubble>Thanks {a.name}.</Bubble>
              <Bubble>One last thing before we go.</Bubble>
            </AgencyTurn>

            <UserTurn heading={userHeading} initial={userInitial}>
              <FormShell active={isActive('source')}>
                <span className="mb-3 block text-[0.75rem] uppercase tracking-[0.18em] text-text-tertiary">
                  I found you through
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
                  <div className="flex justify-end">
                    <OkButton
                      disabled={a.source.length === 0}
                      onClick={handleSubmit}
                    />
                  </div>
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
                  <Bubble>Sending&hellip;</Bubble>
                ) : (
                  <>
                    <Bubble>
                      That&rsquo;s everything — message received.
                    </Bubble>
                    <Bubble>
                      We&rsquo;ll get back to you within one business day at
                      <span className="text-accent"> {a.email}</span>.
                    </Bubble>
                    <Bubble>Talk soon, {a.name} 🤝</Bubble>
                  </>
                )}
              </AgencyTurn>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
