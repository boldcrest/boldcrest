'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { categoryColor } from '@/lib/diaryCategories'

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
  initialCategory?: string
}

/* The card is a <div> (not one big <Link>) so the category pill can be its own
   interactive control — clicking it filters the grid to that category in place
   (no <a> nested in <a>). Image, title and excerpt link to the post. */
function DiaryCard({
  post,
  onSelectCategory,
}: {
  post: DiaryPost
  onSelectCategory: (category: string) => void
}) {
  const color = categoryColor(post.category)
  const postHref = `/diary/${post.slug?.current}`

  return (
    <div className="group block">
      {/* Image container — 4:3 to match the /work grid */}
      <Link href={postHref} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#1a1a1a] md:rounded-2xl">
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
      </Link>

      {/* Info below image */}
      <div className="mt-3 md:mt-5">
        {post.category && (
          <button
            type="button"
            onClick={() => onSelectCategory(post.category!)}
            className="mb-2 inline-block rounded-[var(--radius-pill)] border px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.12em] transition-all duration-200 md:mb-3 md:px-3 md:py-1 md:text-[0.6rem]"
            style={{ borderStyle: 'solid', borderWidth: '1px', borderColor: '#a3a3a3', color: '#a3a3a3' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.backgroundColor = color
              el.style.borderColor = color
              el.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.backgroundColor = 'transparent'
              el.style.borderColor = '#a3a3a3'
              el.style.color = '#a3a3a3'
            }}
          >
            {post.category}
          </button>
        )}

        <Link href={postHref} className="block">
          <h3 className="font-display text-[0.85rem] font-bold uppercase leading-[1.2] tracking-[0.02em] text-white transition-colors duration-200 group-hover:text-text-tertiary md:text-[clamp(1rem,1.5vw,1.3rem)]">
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="mt-2 line-clamp-2 hidden text-[0.8rem] leading-[1.6] text-text-secondary md:block">
              {post.excerpt}
            </p>
          )}
        </Link>
      </div>
    </div>
  )
}

export default function DiaryPageClient({ posts, initialCategory }: DiaryPageClientProps) {
  const [activeFilter, setActiveFilter] = useState(
    initialCategory && initialCategory !== 'All' ? initialCategory : 'All'
  )

  // Mirror the active category into the URL with router.replace (Next must own
  // the history entry so the browser Back button from a post restores it; a
  // native replaceState is dropped on back). A fresh /diary visit has no query,
  // so the filter starts clean and never gets permanently stuck.
  const router = useRouter()
  useEffect(() => {
    const target =
      activeFilter !== 'All'
        ? `/diary?category=${encodeURIComponent(activeFilter)}`
        : '/diary'
    if (window.location.pathname + window.location.search !== target) {
      router.replace(target, { scroll: false })
    }
  }, [activeFilter, router])

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

  // Clicking a post's category pill filters the grid in place and scrolls up so
  // the active filter bar is in view.
  const handleSelectCategory = (category: string) => {
    setActiveFilter(category)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="relative">
      {/* Hero */}
      <section className="flex flex-col px-[var(--gutter)] pt-[120px] pb-0 landscape-short:pt-[5.5rem]">
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
              className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-[1] tracking-[-0.03em] text-white landscape-short:text-[2.25rem]"
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
              className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-14 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8"
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
                  <DiaryCard post={post} onSelectCategory={handleSelectCategory} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  )
}
