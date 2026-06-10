'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'
import ScrollReveal from '@/components/ScrollReveal'
import { withSmallMarks } from '@/lib/marks'

interface Project {
  _id: string
  name: string
  slug: { current: string }
  client?: string
  tagline?: string
  industry?: string
  services?: string[]
  thumbnailType?: string
  thumbnail?: {
    asset: { _ref: string }
  }
  thumbnailVideo?: string
}

interface SelectedWorksProps {
  projects: Project[]
}

function ProjectCard({
  project,
  index,
}: {
  project: Project
  index: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{
        duration: 0.9,
        delay: index % 2 === 0 ? 0 : 0.15,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link href={`/work/${project.slug?.current}`} className="group block">
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
              src={urlFor(project.thumbnail).width(1200).height(900).url()}
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
              {withSmallMarks(project.tagline || project.name)}
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
            {withSmallMarks(project.tagline || project.name)}
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

export default function SelectedWorks({ projects }: SelectedWorksProps) {
  if (!projects.length) return null

  const padded: Project[] = []
  for (let i = 0; i < Math.min(6, Math.max(projects.length, 6)); i++) {
    padded.push({
      ...projects[i % projects.length],
      _id:
        projects[i % projects.length]._id +
        (i >= projects.length ? `-dup-${i}` : ''),
    })
  }

  return (
    <section className="px-[var(--gutter)] pb-[var(--space-2xl)]">
      <div className="w-full">
        {/* Section Header */}
        <ScrollReveal>
          <div className="mb-4 h-px bg-border" />
          <div className="mb-[var(--space-lg)] flex items-center justify-between">
            <h2 className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-secondary">
              Selected Works
            </h2>
            <Link
              href="/work"
              className="group/link flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-text-tertiary transition-all duration-[0.5s] hover:gap-3 hover:text-text-secondary"
              style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}
            >
              <span className="inline-flex overflow-hidden" style={{ height: '1.2em' }}>
                <span
                  className="flex flex-col transition-transform duration-[0.5s] group-hover/link:-translate-y-1/2"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}
                >
                  <span className="leading-[1.2]">See All</span>
                  <span className="leading-[1.2]">See All</span>
                </span>
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="transition-transform duration-[0.5s] group-hover/link:translate-x-1"
                style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </ScrollReveal>

        {/* 2-column grid */}
        <div className="grid grid-cols-1 gap-x-5 gap-y-8 md:grid-cols-2">
          {padded.map((project, i) => (
            <ProjectCard key={project._id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
