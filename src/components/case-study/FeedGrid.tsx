'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'

export interface FeedImage {
  _key?: string
  alt?: string
  asset?: { _ref?: string }
}

interface FeedGridProps {
  feed: FeedImage[]
  heading: string
}

/**
 * The grid, laid out the way Instagram lays it out: three across, square crops,
 * hairline gaps, in colour.
 *
 * Deliberately NOT the site's usual black-and-white-until-hover treatment — the
 * point of this block is to show the feed as it actually looks on the profile,
 * so desaturating it would misrepresent the work.
 *
 * Width is capped rather than full-bleed so it reads as a phone/profile grid
 * instead of a wall of images.
 */
export default function FeedGrid({ feed, heading }: FeedGridProps) {
  const items = (feed ?? []).filter((img) => img?.asset?._ref)
  if (items.length === 0) return null

  return (
    <section className="px-[var(--gutter)] py-[var(--space-2xl)]">
      <div className="mx-auto max-w-[var(--max-width)]">
        <h2 className="mb-[var(--space-lg)] text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
          {heading}
        </h2>
      </div>

      <div className="mx-auto w-full max-w-[880px]">
        <div className="grid grid-cols-3 gap-[3px] md:gap-[5px]">
          {items.map((img, i) => (
            <motion.div
              key={img._key ?? i}
              className="relative aspect-square overflow-hidden bg-bg-card"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                // Stagger by column so it fills in the way a feed loads.
                delay: Math.min(i, 8) * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Image
                src={urlFor(img).width(700).height(700).url()}
                alt={img.alt || ''}
                fill
                loader={sanityImageLoader}
                sizes="(max-width: 768px) 33vw, 293px"
                className="object-cover"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
