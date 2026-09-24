'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { motion } from 'framer-motion'
import ReelsFeed from './ReelsFeed'
import type { Reel } from './ReelsCarousel'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'

export interface FeedImage {
  _key?: string
  alt?: string
  asset?: { _ref?: string }
  /** A reel in the grid, the way Instagram mixes them in: the tile shows its
   *  cover, cropped to the tile, and opening it plays it in the viewer. */
  reel?: Reel
}

interface FeedGridProps {
  feed: FeedImage[]
  heading: string
}

/**
 * The grid, laid out the way Instagram lays it out now: three across, 3:4
 * portrait tiles (the square grid went in early 2025), hairline gaps, in
 * colour.
 *
 * Deliberately NOT the site's usual black-and-white-until-hover treatment — the
 * point of this block is to show the feed as it actually looks on the profile,
 * so desaturating it would misrepresent the work.
 *
 * It sits on the same measure as its heading — left edge on the gutter, the
 * site's max width — scaled to fit rather than capped and centred, which had
 * left it floating a step in from the heading above it.
 *
 * Every tile opens the same full-screen viewer the reels use, on that picture,
 * in reading order: top left first, bottom right last. Same scroll, same give
 * at the ends, same lines, same close.
 */
export default function FeedGrid({ feed, heading }: FeedGridProps) {
  const items = (feed ?? []).filter((img) => img?.asset?._ref || img?.reel?.vimeoUrl)
  const [open, setOpen] = useState<number | null>(null)
  const t = useTranslations('CaseStudy')
  if (items.length === 0) return null

  return (
    <section className="px-[var(--gutter)] pt-[var(--space-xl)] pb-[var(--space-2xl)]">
      <div className="mx-auto max-w-[var(--max-width)]">
        <h2 className="mb-[var(--space-lg)] text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
          {heading}
        </h2>
      </div>

      <div className="mx-auto w-full max-w-[var(--max-width)]">
        <div className="grid grid-cols-3 gap-[3px] md:gap-[5px]">
          {items.map((img, i) => (
            <motion.button
              type="button"
              key={img._key ?? i}
              onClick={() => setOpen(i)}
              aria-label={img.alt || img.reel?.caption || `${heading} ${i + 1}`}
              className="group relative aspect-[3/4] overflow-hidden bg-bg-card"
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
              {img.reel ? (
                <>
                  {/* the reel's 9:16 cover, as wide as the tile and cropped
                      the same top and bottom, as the grid crops it */}
                  {img.reel.poster && (
                    <span
                      aria-hidden
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${img.reel.poster})` }}
                    />
                  )}
                  {/* the mark the grid gives a reel */}
                  <span aria-hidden className="absolute right-2 top-2 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="4" />
                      <path d="M3 9h18M8.5 3l3 6M14.5 3l3 6" />
                      <path d="M10.5 12.5v5l4-2.5-4-2.5Z" fill="currentColor" stroke="none" />
                    </svg>
                  </span>
                </>
              ) : (
                <Image
                  src={urlFor(img).width(600).height(800).url()}
                  alt={img.alt || ''}
                  fill
                  loader={sanityImageLoader}
                  sizes="(max-width: 768px) 33vw, 293px"
                  className="object-cover"
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {open !== null && (
        <ReelsFeed
          startAt={open}
          onClose={() => setOpen(null)}
          slides={{
            count: items.length,
            ratio: 4 / 3,
            first: t('firstPicture'),
            last: t('lastPicture'),
            // a reel in the grid plays in the viewer as a reel, at 9:16
            reelAt: (i) => items[i].reel,
            render: (i) => (
              <div className="absolute inset-0 bg-bg">
                <Image
                  src={urlFor(items[i]).width(1200).height(1600).url()}
                  alt={items[i].alt || ''}
                  fill
                  loader={sanityImageLoader}
                  sizes="(max-width: 768px) 100vw, 700px"
                  className="object-cover"
                  // the one in view and its neighbours are worth having ready
                  priority={Math.abs(i - open) <= 1}
                />
              </div>
            ),
          }}
        />
      )}
    </section>
  )
}
