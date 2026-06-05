'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'

interface DiaryPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  category?: string
  coverImage?: { asset: { _ref: string } }
  body?: any[]
  publishedAt?: string
}

const LOREM_PARAGRAPHS = [
  `Every brand carries weight — the weight of intention, the weight of perception, the weight of every decision that brought it here. What separates the ones that endure from the ones that fade is simple: clarity of purpose. Not aesthetics alone, not trend-chasing, but the discipline to know what you stand for and say it without apology.`,
  `We have seen it across industries and across borders. The brands that move people are not louder — they are sharper. They understand that design is not decoration. It is a language. And like any language, it only works when it communicates something real.`,
  `At BoldCrest, we approach every project as if reputation is on the line — because it is. Ours and yours. The first question is never "what does the client want to see?" but rather "what does the audience need to feel?" That distinction changes everything.`,
  `There is a reason we named ourselves BoldCrest. Bold — because safe design is invisible design. Crest — because we are always climbing, always pushing toward the peak. And that mindset does not stop at the logo. It is in every frame, every word, every pixel.`,
]

/* Custom Portable Text components — inline images supported between text */
const ptComponents: PortableTextComponents = {
  types: {
    image: ({ value }: { value: any }) => {
      if (!value?.asset) return null
      return (
        <figure className="my-12">
          <div className="overflow-hidden rounded-xl">
            <Image
              loader={sanityImageLoader}
              src={urlFor(value).width(1600).url()}
              alt={value.alt || ''}
              width={1600}
              height={1000}
              className="h-auto w-full"
              sizes="(max-width: 768px) 100vw, 760px"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-3 text-[0.8rem] uppercase tracking-[0.1em] text-text-tertiary">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  block: {
    normal: ({ children }) => (
      <p className="mb-6 text-[1.15rem] leading-[1.75] text-text-primary/85">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mb-4 mt-12 font-display text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-[1.2] tracking-[-0.02em]">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-3 mt-8 font-display text-[1.3rem] font-semibold leading-[1.3]">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-10 border-l-[3px] border-accent pl-6 text-[1.25rem] font-medium italic leading-[1.6] text-text-primary/70">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 transition-colors duration-200 hover:text-accent">
        {children}
      </a>
    ),
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DiaryArticle({ post }: { post: DiaryPost }) {
  const hasBody = post.body && post.body.length > 0
  const hasCover = !!post.coverImage?.asset

  return (
    <main className="relative">
      {/* ── Title hero — same treatment as the People page ── */}
      <section className="px-[var(--gutter)] pt-[120px] pb-[var(--space-lg)]">
        <div className="w-full">
          <motion.nav
            className="mb-[var(--space-md)] flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.15em] text-text-tertiary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/diary" className="transition-colors duration-200 hover:text-white">
              Diary
            </Link>
            {post.category && (
              <>
                <span>/</span>
                <span className="text-text-secondary">{post.category}</span>
              </>
            )}
          </motion.nav>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <motion.h1
              className="max-w-[20ch] font-display text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em]"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {post.title}
            </motion.h1>

            <motion.div
              className="md:max-w-[420px] md:text-right"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {post.excerpt && (
                <p className="text-[1rem] leading-[1.75] text-text-secondary">{post.excerpt}</p>
              )}
              {post.publishedAt && (
                <p className="mt-[var(--space-sm)] text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                  {formatDate(post.publishedAt)}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Featured image — full-bleed band (same dimensions as the People photo strip) ── */}
      {hasCover && (
        <motion.div
          className="relative mt-[var(--space-md)] h-[42dvh] w-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Image
            loader={sanityImageLoader}
            src={urlFor(post.coverImage!).width(2400).url()}
            alt={post.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </motion.div>
      )}

      {/* ── Body — single scroll, inline images between text ── */}
      <section className="px-[var(--gutter)] pt-[var(--space-2xl)] pb-[var(--space-3xl)]">
        <div className="mx-auto grid max-w-[var(--max-width)] grid-cols-1 lg:grid-cols-12 lg:gap-5">
          <div className="lg:col-start-3 lg:col-span-8">
            {hasBody ? (
              <PortableText value={post.body!} components={ptComponents} />
            ) : (
              LOREM_PARAGRAPHS.map((text, i) => (
                <p key={i} className="mb-6 text-[1.15rem] leading-[1.75] text-text-primary/85">
                  {text}
                </p>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── Back to Diary ── */}
      <section className="border-t border-border px-[var(--gutter)] py-[var(--space-xl)]">
        <div className="mx-auto max-w-[var(--max-width)]">
          <Link
            href="/diary"
            className="group inline-flex items-center gap-3 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-text-tertiary transition-colors duration-300 hover:text-text-primary"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-180 transition-transform duration-300 group-hover:-translate-x-1">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Diary
          </Link>
        </div>
      </section>
    </main>
  )
}
