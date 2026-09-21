import { routing } from '@/i18n/routing'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/lib/live'
import { client } from '@/sanity/lib/client'
import {
  projectBySlugQuery,
  relatedProjectsQuery,
  moreProjectsQuery,
  allProjectsQuery,
} from '@/sanity/lib/queries'
import ProjectHero from '@/components/portfolio/ProjectHero'
import ProjectDetails from '@/components/portfolio/ProjectDetails'
import ContentStack from '@/components/portfolio/ContentStack'
import { getVimeoMeta, parseAspectRatio } from '@/lib/vimeo'
import RelatedProjects from '@/components/portfolio/RelatedProjects'
import ServiceCTA from '@/components/services/ServiceCTA'
import JsonLd from '@/components/JsonLd'
import {
  ogImageFrom,
  imageUrlFrom,
  breadcrumbSchema,
  creativeWorkSchema,
} from '@/lib/seo'

export async function generateStaticParams() {
  const projects = await client.fetch(allProjectsQuery, { locale: routing.defaultLocale })
  // Cross product with the locales: returning slugs alone leaves the `locale`
  // segment unresolved, and Next silently drops the whole route to dynamic
  // rendering instead of prerendering it.
  return routing.locales.flatMap((locale) =>
    (projects ?? []).map((p: { slug: { current: string } }) => ({
      locale,
      slug: p.slug.current,
    })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const { data: project } = await sanityFetch({
    query: projectBySlugQuery,
    params: { slug, locale },
  })

  if (!project) return { title: 'Project' }

  const description =
    project.tagline ||
    `${project.name}${project.client ? ` for ${project.client}` : ''}, a ${
      project.services?.[0] || 'creative'
    } project by BoldCrest.`
  const path = `/work/${slug}`
  const ogImage = ogImageFrom(project.thumbnail)
  const fullTitle = `${project.name} — BoldCrest`

  return {
    // Bare name; the layout template appends "— BoldCrest" (avoids doubling).
    title: project.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: fullTitle,
      description,
      url: path,
      images: [{ url: ogImage, width: 1200, height: 630, alt: project.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const { data: project } = await sanityFetch({
    query: projectBySlugQuery,
    params: { slug, locale },
  })

  if (!project) notFound()

  // Resolve each video's native aspect ratio (server-side, cached for a week) so
  // portfolio videos render at their true shape (square/portrait/16:9) instead of
  // being cropped into a fixed 16:9 box.
  const mediaWithAspect = project.media
    ? await Promise.all(
        project.media.map(
          async (block: {
            _type?: string
            vimeoUrl?: string
            aspectRatio?: string
            aspectRatioCustom?: string
          }) => {
            if (block?._type !== 'videoMedia' || !block.vimeoUrl) return block
            const meta = await getVimeoMeta(block.vimeoUrl)
            // Manual override wins ("custom" reads the free-text value);
            // "auto"/unset falls back to Vimeo's real shape.
            const override = parseAspectRatio(
              block.aspectRatio === 'custom' ? block.aspectRatioCustom : block.aspectRatio,
            )
            return { ...block, aspect: override ?? meta.aspect, poster: meta.poster }
          },
        ),
      )
    : project.media
  // Four projects in the same category (service); fall back to recent work to
  // always fill the row.
  const { data: relatedData } = await sanityFetch({
    query: relatedProjectsQuery,
    params: { slug, serviceNames: project.services ?? [], locale },
  })
  const related = [...(relatedData ?? [])]
  if (related.length < 5) {
    const { data: more } = await sanityFetch({
      query: moreProjectsQuery,
      params: { slug, locale },
    })
    const seen = new Set(related.map((p) => p._id))
    for (const p of more ?? []) {
      if (related.length >= 5) break
      if (!seen.has(p._id)) {
        related.push(p)
        seen.add(p._id)
      }
    }
  }

  return (
    <main>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Work', path: '/work' },
          { name: project.name, path: `/work/${slug}` },
        ])}
      />
      <JsonLd
        data={creativeWorkSchema({
          name: project.name,
          description: project.tagline || undefined,
          path: `/work/${slug}`,
          image: imageUrlFrom(project.thumbnail),
          keywords: [
            ...(project.services ?? []),
            project.industry,
            project.client,
            'BoldCrest',
            'creative agency Tirana',
          ],
          about: project.industry,
          datePublished: project.year,
        })}
      />
      <ProjectHero
        name={project.name}
        services={project.services}
        industry={project.industry}
        year={project.year}
      />

      {/* Desktop: Overview / Challenge / Solution directly below the heading */}
      <div className="hidden md:block">
        <ProjectDetails
          overview={project.overview}
          challenge={project.challenge}
          solution={project.solution}
        />
      </div>

      {/* Portfolio media — centred, with the navigator to its right */}
      <section className="px-[var(--gutter)] pb-[var(--space-lg)] pt-[var(--space-xl)] md:pb-[var(--space-lg)]">
        <div className="relative w-full">
          <ContentStack
            media={mediaWithAspect}
            altBase={[project.client, project.name]
              .filter(Boolean)
              .join(', ')}
            altSuffix={[project.services?.[0], 'BoldCrest']
              .filter(Boolean)
              .join(' · ')}
          />
        </div>
      </section>

      {/* Mobile: Overview / Challenge / Solution stacked at the bottom */}
      <div className="md:hidden">
        <ProjectDetails
          overview={project.overview}
          challenge={project.challenge}
          solution={project.solution}
        />
      </div>

      {/* CTA — after the case study, before we send them off to More Work. The
          section divider moves onto the CTA (and off RelatedProjects) so the
          line reads as the end of the case study, with the CTA below it. */}
      <ServiceCTA
        topBorder
        label="Your turn"
        heading="What are we shaping next?"
        description="Tell us what you have in mind. It can be a clear brief or just the start of an idea. We’ll help shape the next steps and keep everything simple from there."
      />

      {/* Related projects — four cards in the same category */}
      <RelatedProjects projects={related} noTopBorder />
    </main>
  )
}
