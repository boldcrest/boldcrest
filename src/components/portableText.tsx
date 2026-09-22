import Image from 'next/image'
import type { PortableTextComponents } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'

/**
 * Shared Portable Text styling for long-form body copy.
 *
 * Lifted verbatim from the diary article so a case study reads identically to a
 * diary post. `DiaryArticle` still carries its own private copy — it is live and
 * working, and swapping it to this import is a tidy-up worth doing on its own,
 * not as a side effect of adding a new template.
 */
export const ptComponents: PortableTextComponents = {
  types: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      <h2 className="mb-4 mt-12 font-display text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-[1.2] tracking-[-0.02em]">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-3 mt-8 font-display text-[1.3rem] font-semibold leading-[1.3]">
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-10 border-l-[3px] border-accent pl-6 text-[1.25rem] font-medium italic leading-[1.6] text-text-primary/70">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-text-primary">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 transition-colors duration-200 hover:text-accent"
      >
        {children}
      </a>
    ),
  },
}
