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
  /** Shown on the tile when it is hovered, the way a portfolio card shows its
   *  project: a title and a line or two on the post. */
  title?: string
  description?: string
  /** A reel in the grid, the way Instagram mixes them in: the tile shows its
   *  cover, cropped to the tile, and opening it plays it in the viewer. */
  reel?: Reel
}

// the picture's step up on hover, the work cards' own (desktop only)
const LIFT =
  'md:transition-transform md:duration-[250ms] md:ease-[cubic-bezier(0.4,0,0.2,1)] md:will-change-transform md:group-hover:-translate-y-12'

/** The grid's four outside corners, rounded; every inside corner stays
 *  square, so the tiles still meet on their hairline gaps. Each corner tile
 *  rounds its own corner (the tile clips what is in it, hover panel included).
 *  With a last row that is not full, the bottom-right corner of the grid is
 *  two tiles: the last one, and the one at the end of the row above it. */
function corner(i: number, n: number) {
  const cols = 3
  const lastRowStart = Math.floor((n - 1) / cols) * cols
  const out: string[] = []
  if (i === 0) out.push('rounded-tl-[var(--radius-lg)]')
  if (i === Math.min(cols, n) - 1) out.push('rounded-tr-[var(--radius-lg)]')
  if (i === lastRowStart) out.push('rounded-bl-[var(--radius-lg)]')
  if (i === n - 1) out.push('rounded-br-[var(--radius-lg)]')
  if (n % cols !== 0 && n > cols && i === lastRowStart - 1) out.push('rounded-br-[var(--radius-lg)]')
  return out.join(' ')
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
      <div className="mx-auto w-full max-w-[1200px]">
        <h2 className="mb-[var(--space-lg)] text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
          {heading}
        </h2>
      </div>

      <div className="mx-auto w-full max-w-[1200px]">
        <div className="grid grid-cols-3 gap-[3px] md:gap-[5px]">
          {items.map((img, i) => (
            <motion.button
              type="button"
              key={img._key ?? i}
              onClick={() => setOpen(i)}
              aria-label={img.alt || img.reel?.caption || `${heading} ${i + 1}`}
              // [transform:translate3d(0,0,0)]: the tile on its own layer, so
              // its clip holds for what moves inside it (as on the work cards)
              className={`group relative aspect-[3/4] overflow-hidden bg-bg-card text-left [transform:translate3d(0,0,0)] md:hover:bg-[#0a0a0a] ${corner(i, items.length)}`}
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
                      className={`absolute inset-0 bg-cover bg-center ${LIFT}`}
                      style={{ backgroundImage: `url(${img.reel.poster})` }}
                    />
                  )}
                  {/* the mark the grid gives a reel */}
                  {/* 26px and 20px in on a desktop; on a phone the tile is a
                      third of the screen, so 16px and 8px in. The same inset
                      from the top as from the side either way, so it sits
                      square in the corner. */}
                  <span aria-hidden className="absolute right-2 top-2 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] md:right-5 md:top-5">
                    <svg className="size-4 md:size-[26px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
                  sizes="(max-width: 768px) 33vw, 400px"
                  className={`object-cover ${LIFT}`}
                />
              )}
              {/* The post's title and a line on it, on hover: the work cards'
                  own move. The picture slides up a step and a panel of the
                  page's black grows from the bottom edge, as tall as what it
                  says. A pixel below the tile, given back as padding, so its
                  fill always covers the clip's edge. Desktop only, as there. */}
              {(img.title || img.description || img.reel?.caption) && (
                <span className="absolute -bottom-px left-0 z-20 hidden w-full origin-bottom scale-y-0 bg-[#0a0a0a] px-5 pt-[1.4rem] pb-[calc(1rem+1px)] transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100 md:block">
                  <span className="block font-display text-[1.05rem] font-semibold uppercase leading-[1.15] text-text-primary">
                    {img.title || img.reel?.caption}
                  </span>
                  {img.description && (
                    <span className="mt-2 block text-[0.8rem] leading-[1.55] text-text-secondary">
                      {img.description}
                    </span>
                  )}
                </span>
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
            // the same words the tile shows on hover, under the frame
            captionAt: (i) => ({
              title: items[i].title || items[i].reel?.caption,
              description: items[i].description,
            }),
            render: (i) => (
              <div className="absolute inset-0 overflow-hidden bg-bg md:rounded-[var(--radius-lg)]">
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
