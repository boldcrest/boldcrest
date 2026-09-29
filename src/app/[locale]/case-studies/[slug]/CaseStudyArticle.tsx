import { PortableText } from '@portabletext/react'
import { getVimeoMeta } from '@/lib/vimeo'
import { ptComponents } from '@/components/portableText'
import CaseStudyHero from '@/components/case-study/CaseStudyHero'
import ReelsCarousel, { type Reel } from '@/components/case-study/ReelsCarousel'
import FeedGrid, { type FeedImage } from '@/components/case-study/FeedGrid'
import ServiceCTA from '@/components/services/ServiceCTA'

export interface CaseStudy {
  _id: string
  title: string
  slug: { current: string }
  client?: string
  excerpt?: string
  unlisted?: boolean
  kpi: { value?: string; label?: string; context?: string }
  stats?: { value?: string; label?: string }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  explanation?: any[]
  reels?: Reel[]
  feed?: FeedImage[]
  publishedAt?: string
}

interface Labels {
  eyebrow: string
  reels: string
  close: string
  feed: string
  ctaHeading: string
  ctaBody: string
}

/**
 * Case-study page body. Order is deliberate: the number first (the claim), then
 * the write-up (the proof), then the work itself (reels, then the feed).
 */
export default async function CaseStudyArticle({
  study,
  labels,
}: {
  study: CaseStudy
  labels: Labels
}) {
  // Resolve each reel's Vimeo cover AND true aspect here, on the server, the
  // same way the /work cards do. getVimeoMeta caches for a week, so this is one
  // oEmbed call per clip per week rather than per request.
  const reels = await Promise.all(
    (study.reels ?? []).map(async (reel) => {
      const meta = await getVimeoMeta(reel.vimeoUrl)
      // a clip served as a file has no Vimeo cover to fetch; it brings its own
      return { ...reel, poster: meta.poster ?? reel.poster ?? null, aspect: meta.aspect }
    }),
  )

  // A reel in the grid needs its cover the same way, or its tile is a blank
  // square until it is opened.
  const feed = await Promise.all(
    (study.feed ?? []).map(async (item) => {
      if (!item.reel?.vimeoUrl) return item
      const meta = await getVimeoMeta(item.reel.vimeoUrl)
      return { ...item, reel: { ...item.reel, poster: meta.poster ?? item.reel.poster ?? null } }
    }),
  )

  return (
    <article>
      <CaseStudyHero
        eyebrow={labels.eyebrow}
        client={study.client}
        title={study.title}
        kpi={study.kpi ?? {}}
        stats={study.stats}
      />

      {study.explanation && study.explanation.length > 0 && (
        <section className="px-[var(--gutter)]">
          {/* Everything under the hero shares ONE column: the work pages'
              1200px measure, centred, with every block starting on its left
              edge. Only the hero runs gutter to gutter. */}
          <div className="mx-auto w-full max-w-[1200px]">
            {/* the same step above the line as below it and as above the
                figures (space-lg): the line sat right on their labels */}
            <div className="mt-[var(--space-lg)] max-w-[760px] border-t border-border pt-[var(--space-lg)]">
              <PortableText value={study.explanation} components={ptComponents} />
            </div>
          </div>
        </section>
      )}

      <ReelsCarousel
        reels={reels}
        heading={labels.reels}
      />

      <FeedGrid feed={feed} heading={labels.feed} />
      {/* The ask, once the work has been seen: the service pages' block, with
          the copy turned to a case study — the visitor has just watched numbers
          move, so the question is whether they want theirs moved. On the same
          column as the feed above it. */}
      <ServiceCTA
        heading={labels.ctaHeading}
        description={labels.ctaBody}
        measureClassName="mx-auto w-full max-w-[1200px]"
        topBorder
        beforeFooter
      />
    </article>
  )
}
