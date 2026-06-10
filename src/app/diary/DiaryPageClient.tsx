'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'
import ScrollReveal from '@/components/ScrollReveal'
import {
  ScrollRevealStagger,
  ScrollRevealItem,
} from '@/components/ScrollReveal'

interface DiaryPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  category?: string
  coverImage?: { asset: { _ref: string } }
  publishedAt?: string
}

interface DiaryPageClientProps {
  posts: DiaryPost[]
}

const CATEGORY_COLORS: Record<string, string> = {
  Branding: '#DA291C',
  Design: '#f9b311',
  Motion: '#004c95',
  Culture: '#DA291C',
  Strategy: '#f9b311',
}

function DiaryCard({ post }: { post: DiaryPost }) {
  const color = CATEGORY_COLORS[post.category || ''] || '#DA291C'

  return (
    <Link href={`/diary/${post.slug?.current}`} className="group block">
      {/* Image container — 4:3 to match the /work grid */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#1a1a1a]">
        {post.coverImage?.asset ? (
          <Image
            loader={sanityImageLoader}
            src={urlFor(post.coverImage).width(1400).height(1050).url()}
            alt={post.title}
            fill
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="px-4 text-center text-[1.2rem] font-bold uppercase leading-[1.1] tracking-[-0.02em] text-white/10 md:px-8 md:text-[3rem]">
              {post.title}
            </span>
          </div>
        )}
      </div>

      {/* Info below image */}
      <div className="mt-3 md:mt-5">
        {post.category && (
          <span
            className="mb-2 inline-block rounded-[var(--radius-pill)] border border-white/15 px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.12em] text-text-tertiary transition-all duration-200 md:mb-3 md:px-3 md:py-1 md:text-[0.6rem]"
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.backgroundColor = color
              el.style.borderColor = color
              el.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.backgroundColor = 'transparent'
              el.style.borderColor = ''
              el.style.color = ''
            }}
          >
            {post.category}
          </span>
        )}

        <h3 className="font-display text-[0.85rem] font-bold uppercase leading-[1.3] tracking-[0.02em] text-white transition-colors duration-200 group-hover:text-text-tertiary md:text-[clamp(1rem,1.5vw,1.3rem)]">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="mt-2 line-clamp-2 hidden text-[0.8rem] leading-[1.6] text-text-secondary md:block">
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  )
}

export default function DiaryPageClient({ posts }: DiaryPageClientProps) {
  const [activeFilter, setActiveFilter] = useState('All')

  const categories = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['All', ...Array.from(set)]
  }, [posts])

  const filtered = useMemo(() => {
    if (activeFilter === 'All') return posts
    return posts.filter((p) => p.category === activeFilter)
  }, [posts, activeFilter])

  return (
    <main className="relative">
      {/* Hero */}
      <section className="flex flex-col px-[var(--gutter)] pt-[120px] pb-0">
        <div>
          <motion.p
            className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Diary
          </motion.p>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <motion.h1
              className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-[1] tracking-[-0.03em] text-white"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              The Latest<br />
              From Our<br />
              World<span className="text-accent">.</span>
            </motion.h1>

            <motion.p
              className="max-w-[400px] text-[0.95rem] leading-[1.7] text-text-secondary md:text-right"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              Read deeper into what we do, think, and create at BoldCrest.
            </motion.p>
          </div>
        </div>

        {/* Divider + Filters — line sits directly below the hero, above the filters (matches Work) */}
        <div className="mt-10 md:mt-12 lg:mt-16">
          {/* Divider — directly below hero, above filters */}
          <div className="h-px w-full bg-border" />
          <motion.div
            className="mt-6 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className="text-[0.75rem] font-semibold uppercase tracking-[0.15em] transition-colors duration-200"
                style={{ color: activeFilter === cat ? '#a3a3a3' : '#ffffff' }}
                onMouseEnter={(e) => { if (activeFilter !== cat) e.currentTarget.style.color = '#a3a3a3' }}
                onMouseLeave={(e) => { if (activeFilter !== cat) e.currentTarget.style.color = '#ffffff' }}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="px-[var(--gutter)] pt-[var(--space-xl)] pb-[var(--space-3xl)]">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              className="flex min-h-[300px] items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-[1rem] text-text-tertiary">
                No posts yet. Check back soon.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeFilter}
              className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {filtered.map((post, i) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(i, 10) * 0.06,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <DiaryCard post={post} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  )
}
