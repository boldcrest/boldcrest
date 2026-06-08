'use client'

import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'

interface RelatedProject {
  _id: string
  name: string
  slug: { current: string }
  tagline?: string
  client?: string
  industry?: string
  services?: string[]
  thumbnail?: { asset?: { _ref: string } }
  thumbnailType?: string
  thumbnailVideo?: string
}

export default function RelatedProjects({
  projects,
  heading = 'More Work',
}: {
  projects?: RelatedProject[]
  heading?: string
}) {
  if (!projects || projects.length === 0) return null

  return (
    <section className="border-t border-border px-[var(--gutter)] py-[var(--space-2xl)]">
      <div className="w-full">
        <h2 className="mb-[var(--space-lg)] text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
          {heading}
        </h2>

        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-5">
          {projects.map((project) => (
            <Link
              key={project._id}
              href={`/work/${project.slug.current}`}
              className="group block"
            >
              {/* Thumbnail */}
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-bg-card">
                {project.thumbnail?.asset?._ref ? (
                  <Image
                    loader={sanityImageLoader}
                    src={urlFor(project.thumbnail).width(800).height(600).quality(80).url()}
                    alt={project.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 23vw"
                    className="object-cover transition-transform duration-[0.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-bg-card">
                    <span className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                      {project.client || project.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Caption */}
              {project.client && (
                <span className="mt-3 block text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
                  {project.client}
                </span>
              )}
              <h3 className="mt-1 font-display text-[0.95rem] font-semibold uppercase leading-[1.2] text-text-primary transition-colors duration-300 group-hover:text-accent">
                {project.tagline || project.name}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
