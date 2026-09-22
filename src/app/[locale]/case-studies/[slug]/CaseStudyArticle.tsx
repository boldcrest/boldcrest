import { PortableText } from '@portabletext/react'
import { getVimeoMeta } from '@/lib/vimeo'
import { ptComponents } from '@/components/portableText'
import CaseStudyHero from '@/components/case-study/CaseStudyHero'
import ReelsCarousel, { type Reel } from '@/components/case-study/ReelsCarousel'
import FeedGrid, { type FeedImage } from '@/components/case-study/FeedGrid'

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
  reelsHint: string
  close: string
  feed: string
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
      return { ...reel, poster: meta.poster, aspect: meta.aspect }
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
        <section className="px-[var(--gutter)] pb-[var(--space-xl)]">
          <div className="mx-auto max-w-[var(--max-width)]">
            <div className="max-w-[760px] border-t border-border pt-[var(--space-lg)]">
              <PortableText value={study.explanation} components={ptComponents} />
            </div>
          </div>
        </section>
      )}

      <ReelsCarousel
        reels={reels}
        heading={labels.reels}
        hint={labels.reelsHint}
        closeLabel={labels.close}
      />

      <FeedGrid feed={study.feed ?? []} heading={labels.feed} />
    </article>
  )
}
