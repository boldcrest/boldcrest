'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
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
  thumbnail?: { asset: { _ref: string } }
  thumbnailType?: string
  thumbnailVideo?: string
}

interface ProjectMarqueeProps {
  heading?: string
  projects: Project[]
  accentColor?: string
}

export default function ProjectMarquee({
  heading,
  projects,
  accentColor = '#DA291C',
}: ProjectMarqueeProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const items = projects.length > 0 ? projects : []
  const repeated = [...items, ...items, ...items, ...items]

  if (items.length === 0) return null

  return (
    <section ref={ref} className="overflow-hidden py-[var(--space-2xl)]">
      {heading && (
        <div className="px-[var(--gutter)]">
          <motion.h2
            className="mb-10 text-center font-display text-[clamp(1.2rem,2.5vw,1.8rem)] font-bold leading-[1.1] tracking-[-0.02em]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {heading}
          </motion.h2>
        </div>
      )}

      {/* Scrolling project thumbnails — sized to match /work grid cards */}
      <div className="relative">
        <div className="flex animate-[marquee_60s_linear_infinite] gap-6 md:gap-8">
          {repeated.map((project, i) => {
            const vimeoId =
              project.thumbnailType === 'video' && project.thumbnailVideo
                ? project.thumbnailVideo.match(/vimeo\.com\/(\d+)/)?.[1]
                : null

            return (
            <Link
              key={`${project._id}-${i}`}
              href={`/work/${project.slug.current}`}
              className="group shrink-0"
              style={{ width: 'clamp(320px, 32vw, 580px)' }}
            >
              {/* Card container */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-bg-card">
                {/* Image / Video — translates UP on hover (desktop only) */}
                {vimeoId ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&muted=1`}
                    className="pointer-events-none absolute top-1/2 left-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 md:transition-transform md:duration-[250ms] md:ease-[cubic-bezier(0.4,0,0.2,1)] md:group-hover:-translate-y-[calc(50%+48px)]"
                    style={{ border: 'none' }}
                    allow="autoplay; fullscreen"
                    loading="lazy"
                  />
                ) : project.thumbnail?.asset?._ref ? (
                  <Image
                    loader={sanityImageLoader}
                    src={urlFor(project.thumbnail).width(1400).height(1050).quality(85).url()}
                    alt={project.name}
                    fill
                    sizes="(max-width: 768px) 80vw, 32vw"
                    className="object-cover md:transition-transform md:duration-[250ms] md:ease-[cubic-bezier(0.4,0,0.2,1)] md:will-change-transform md:group-hover:-translate-y-12"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: `${accentColor}12` }}
                  >
                    <span className="font-display text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                      {project.name}
                    </span>
                  </div>
                )}

                {/* Info panel — scales up from bottom on hover (desktop only) */}
                <div className="absolute bottom-0 left-0 z-20 hidden w-full origin-bottom scale-y-0 bg-[#0a0a0a] px-5 pt-4 pb-4 transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100 md:block">
                  {project.client && (
                    <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
                      {project.client}
                    </span>
                  )}
                  <h3 className="mt-1.5 font-display text-[1.05rem] font-semibold text-text-primary">
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
                <h3 className="mt-1 font-display text-[1rem] font-semibold text-text-primary">
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
            )
          })}
        </div>
      </div>
    </section>
  )
}
