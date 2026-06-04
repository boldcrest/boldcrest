'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'

interface Project {
  _id: string
  name: string
  slug: { current: string }
  tagline?: string
  client?: string
  industry?: string
  services?: string[]
  thumbnailType?: string
  thumbnail?: {
    asset: { _ref: string }
  }
  thumbnailVideo?: string
}

interface WorkPageClientProps {
  projects: Project[]
  initialService?: string
  initialIndustry?: string
}

function useInViewOnce(margin = '-50px') {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: margin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [margin])

  return { ref, isVisible }
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const { ref, isVisible } = useInViewOnce()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: 0.7,
        delay: Math.min(index % 4, 3) * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={`/work/${project.slug?.current}`}
        className="group block"
      >
        {/* Card container — fixed aspect, overflow hidden */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-bg-card">
          {/* Image — translates UP on hover (desktop only) */}
          {project.thumbnailType === 'video' && project.thumbnailVideo ? (
            <iframe
              src={`https://player.vimeo.com/video/${project.thumbnailVideo.match(/vimeo\.com\/(\d+)/)?.[1]}?background=1&autoplay=1&loop=1&muted=1`}
              className="pointer-events-none absolute top-1/2 left-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 md:transition-transform md:duration-[250ms] md:ease-[cubic-bezier(0.4,0,0.2,1)] md:group-hover:-translate-y-[calc(50%+48px)]"
              style={{ border: 'none' }}
              allow="autoplay; fullscreen"
              loading="lazy"
            />
          ) : project.thumbnail?.asset ? (
            <Image
              loader={sanityImageLoader}
              src={urlFor(project.thumbnail)
                .width(1400)
                .height(1050)
                .url()}
              alt={project.name}
              fill
              loading="lazy"
              className="object-cover md:transition-transform md:duration-[250ms] md:ease-[cubic-bezier(0.4,0,0.2,1)] md:will-change-transform md:group-hover:-translate-y-12"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-card">
              <div className="h-[60px] w-[60px] rounded-full border-2 border-text-tertiary" />
            </div>
          )}

          {/* Info panel — grows up from bottom on hover (desktop only) */}
          <div
            className="absolute bottom-0 left-0 z-20 hidden w-full origin-bottom scale-y-0 bg-[#0a0a0a] px-5 pt-4 pb-4 transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100 md:block"
          >
            {project.client && (
              <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
                {project.client}
              </span>
            )}
            <h3 className="mt-1.5 font-display text-[1.15rem] font-semibold uppercase text-text-primary">
              {project.tagline || project.name}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {project.industry && (
                <span className="rounded-[var(--radius-pill)] bg-white/10 px-3.5 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-text-secondary">
                  {project.industry}
                </span>
              )}
              {project.services?.map((service) => (
                <span
                  key={service}
                  className="rounded-[var(--radius-pill)] border border-border px-3.5 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-text-tertiary"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile info — always visible below card */}
        <div className="mt-3 md:hidden">
          {project.client && (
            <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
              {project.client}
            </span>
          )}
          <h3 className="mt-1 font-display text-[1rem] font-semibold uppercase text-text-primary">
            {project.tagline || project.name}
          </h3>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {project.industry && (
              <span className="rounded-[var(--radius-pill)] bg-white/10 px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-text-secondary">
                {project.industry}
              </span>
            )}
            {project.services?.map((service) => (
              <span
                key={service}
                className="rounded-[var(--radius-pill)] border border-border px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-text-tertiary"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function ProjectListRow({ project, index }: { project: Project; index: number }) {
  const { ref, isVisible } = useInViewOnce()
  const [hovered, setHovered] = useState(false)
  const [mouseMoving, setMouseMoving] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const rowRef = useRef<HTMLAnchorElement>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setMouseMoving(false)
      if (scrollTimer.current) clearTimeout(scrollTimer.current)
      scrollTimer.current = setTimeout(() => setMouseMoving(true), 150)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimer.current) clearTimeout(scrollTimer.current)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    setMouseMoving(true)
    setMousePos({
      x: e.clientX,
      y: e.clientY,
    })
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index, 8) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        ref={rowRef}
        href={`/work/${project.slug?.current}`}
        className="group relative flex items-center justify-between border-b border-border py-5 transition-colors duration-200 hover:border-text-tertiary"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={handleMouseMove}
      >
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-[clamp(1.1rem,2vw,1.5rem)] font-bold text-text-primary transition-colors duration-200 group-hover:text-white">
            {project.client || project.name}
          </h3>
          {(project.tagline || (project.client && project.name)) && (
            <span className="font-display text-[clamp(1.1rem,2vw,1.5rem)] font-normal text-text-primary">
              {project.tagline || project.name}
            </span>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {project.services?.slice(0, 2).map((service) => (
            <span
              key={service}
              className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-tertiary"
            >
              {service}
            </span>
          ))}
        </div>

        {/* Hover thumbnail */}
        <AnimatePresence>
          {hovered && mouseMoving && project.thumbnail?.asset && (
            <motion.div
              className="pointer-events-none fixed z-30"
              style={{
                left: mousePos.x + 20,
                top: mousePos.y - 80,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative h-[160px] w-[240px] overflow-hidden rounded-lg shadow-2xl">
                <Image
                  loader={sanityImageLoader}
                  src={urlFor(project.thumbnail).width(480).height(320).url()}
                  alt={project.name}
                  fill
                  className="object-cover"
                  sizes="240px"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  )
}

function InlineFilter({
  openFilter,
  setOpenFilter,
  serviceFilter,
  setServiceFilter,
  industryFilter,
  setIndustryFilter,
  allServices,
  allIndustries,
}: {
  openFilter: 'services' | 'industry' | null
  setOpenFilter: (v: 'services' | 'industry' | null) => void
  serviceFilter: string
  setServiceFilter: (v: string) => void
  industryFilter: string
  setIndustryFilter: (v: string) => void
  allServices: string[]
  allIndustries: string[]
}) {
  const labelClass =
    'text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-text-secondary cursor-pointer transition-colors duration-200 hover:text-[#a3a3a3]'
  const itemClass =
    'text-[0.7rem] font-medium uppercase tracking-[0.1em] cursor-pointer transition-colors duration-200 hover:text-white whitespace-nowrap'

  const items = openFilter === 'services'
    ? allServices.filter((s) => s !== 'All')
    : allIndustries.filter((s) => s !== 'All')

  const handleSelect = (value: string) => {
    if (openFilter === 'services') {
      setServiceFilter(value === serviceFilter ? 'All' : value)
    } else {
      setIndustryFilter(value === industryFilter ? 'All' : value)
    }
    setOpenFilter(null)
  }

  return (
    <motion.div
      className="flex items-center gap-5 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnimatePresence mode="wait">
        {openFilter === null ? (
          /* ── Collapsed: show both labels ── */
          <motion.div
            key="collapsed"
            className="flex items-center gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <button
              onClick={() => setOpenFilter('services')}
              className={`${labelClass} flex items-center gap-2`}
            >
              Services
              {serviceFilter !== 'All' && (
                <span className="text-[#a3a3a3]">{serviceFilter}</span>
              )}
            </button>
            {serviceFilter !== 'All' && (
              <button
                onClick={(e) => { e.stopPropagation(); setServiceFilter('All') }}
                className="-ml-1 text-[1rem] leading-none text-[#a3a3a3] transition-colors duration-200 hover:text-white"
              >
                &times;
              </button>
            )}
            <span className="h-3 w-px bg-text-tertiary" />
            <button
              onClick={() => setOpenFilter('industry')}
              className={`${labelClass} flex items-center gap-2`}
            >
              Industry
              {industryFilter !== 'All' && (
                <span className="text-[#a3a3a3]">{industryFilter}</span>
              )}
            </button>
            {industryFilter !== 'All' && (
              <button
                onClick={(e) => { e.stopPropagation(); setIndustryFilter('All') }}
                className="-ml-1 text-[1rem] leading-none text-[#a3a3a3] transition-colors duration-200 hover:text-white"
              >
                &times;
              </button>
            )}
          </motion.div>
        ) : (
          /* ── Expanded: label + items + X ── */
          <motion.div
            key={`expanded-${openFilter}`}
            className="flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-white whitespace-nowrap">
              {openFilter === 'services' ? 'Services' : 'Industry'}
            </span>
            <span className="h-3 w-px bg-border" />
            <div className="flex items-center gap-3">
              {items.map((item, i) => (
                <motion.button
                  key={item}
                  onClick={() => handleSelect(item)}
                  className={itemClass}
                  style={{ color: '#a3a3a3' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#a3a3a3' }}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: i * 0.04,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {item}
                </motion.button>
              ))}
              <motion.button
                onClick={() => setOpenFilter(null)}
                className="ml-1 flex-shrink-0 text-[1rem] leading-none transition-colors duration-200 focus:outline-none"
                style={{ color: '#a3a3a3' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#a3a3a3' }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.3,
                  delay: items.length * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                &times;
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function WorkPageClient({ projects, initialService, initialIndustry }: WorkPageClientProps) {
  const [serviceFilter, setServiceFilter] = useState(initialService || 'All')
  const [industryFilter, setIndustryFilter] = useState(initialIndustry || 'All')
  const [openFilter, setOpenFilter] = useState<'services' | 'industry' | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const allServices = useMemo(() => {
    const set = new Set<string>()
    projects.forEach((p) => p.services?.forEach((s) => set.add(s)))
    return ['All', ...Array.from(set)]
  }, [projects])

  const allIndustries = useMemo(() => {
    const set = new Set<string>()
    projects.forEach((p) => {
      if (p.industry) set.add(p.industry)
    })
    return ['All', ...Array.from(set)]
  }, [projects])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchService =
        serviceFilter === 'All' || p.services?.includes(serviceFilter)
      const matchIndustry =
        industryFilter === 'All' || p.industry === industryFilter
      return matchService && matchIndustry
    })
  }, [projects, serviceFilter, industryFilter])

  return (
    <main className="relative">
      {/* ── Hero ── */}
      <section className="flex flex-col px-[var(--gutter)] pt-[120px] pb-0">
        <div>
          <motion.p
            className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Our Work
          </motion.p>

          {/* Title row — h1 left, description right-aligned to bottom of h1 */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <motion.h1
              className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-[1] tracking-[-0.03em] text-white"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              Bold<br />
              Builds<br />
              Brands<span className="text-accent">.</span>
            </motion.h1>

            <motion.p
              className="max-w-[400px] text-[0.95rem] leading-[1.7] text-text-secondary md:text-right"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              A curated collection of brand identities, campaigns, and visual systems built for ambitious brands. Every project is a partnership — crafted with intention, delivered with precision.
            </motion.p>
          </div>

        </div>

        {/* Filters + View Toggle + Divider — grouped so justify-between only splits title vs. this block */}
        <div className="mt-10 md:mt-12 lg:mt-16">
          <div className="flex items-center justify-between">
            <InlineFilter
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              serviceFilter={serviceFilter}
              setServiceFilter={setServiceFilter}
              industryFilter={industryFilter}
              setIndustryFilter={setIndustryFilter}
              allServices={allServices}
              allIndustries={allIndustries}
            />

            {/* Grid / List toggle */}
            <div className="hidden items-center gap-3 md:flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`transition-colors duration-200 ${viewMode === 'grid' ? 'text-white' : 'text-text-tertiary hover:text-white'}`}
                aria-label="Grid view"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="0.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="10.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="0.5" y="10.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="10.5" y="10.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`transition-colors duration-200 ${viewMode === 'list' ? 'text-white' : 'text-text-tertiary hover:text-white'}`}
                aria-label="List view"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <line x1="0" y1="2" x2="18" y2="2" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="0" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="0" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="0" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-4 h-px w-full bg-border" />
        </div>
      </section>

      {/* ── Projects ── */}
      <section className={`px-[var(--gutter)] pb-[var(--space-3xl)] ${viewMode === 'grid' ? 'pt-[var(--space-xl)]' : 'pt-0'}`}>
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filtered.map((project, i) => (
                <ProjectCard key={project._id} project={project} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filtered.map((project, i) => (
                <ProjectListRow key={project._id} project={project} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-text-tertiary">
            No projects match the selected filters.
          </div>
        )}
      </section>
    </main>
  )
}
