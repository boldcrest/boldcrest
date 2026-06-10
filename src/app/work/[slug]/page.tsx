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
import RelatedProjects from '@/components/portfolio/RelatedProjects'
import JsonLd from '@/components/JsonLd'
import {
  ogImageFrom,
  imageUrlFrom,
  breadcrumbSchema,
  creativeWorkSchema,
} from '@/lib/seo'

export async function generateStaticParams() {
  const projects = await client.fetch(allProjectsQuery)
  return (projects ?? []).map((p: { slug: { current: string } }) => ({
    slug: p.slug.current,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: project } = await sanityFetch({
    query: projectBySlugQuery,
    params: { slug },
  })

  if (!project) return { title: 'Project' }

  const description =
    project.tagline ||
    `${project.name}${project.client ? ` for ${project.client}` : ''} — a ${
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
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: project } = await sanityFetch({
    query: projectBySlugQuery,
    params: { slug },
  })

  if (!project) notFound()

  // Four projects in the same category (service); fall back to recent work to
  // always fill the row.
  const { data: relatedData } = await sanityFetch({
    query: relatedProjectsQuery,
    params: { slug, serviceNames: project.services ?? [] },
  })
  const related = [...(relatedData ?? [])]
  if (related.length < 5) {
    const { data: more } = await sanityFetch({
      query: moreProjectsQuery,
      params: { slug },
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
      <section className="px-[var(--gutter)] pb-[var(--space-2xl)] pt-[var(--space-xl)]">
        <div className="relative w-full">
          <ContentStack
            media={project.media}
            thumbnail={project.thumbnail}
            thumbnailVideo={project.thumbnailVideo}
            thumbnailType={project.thumbnailType}
            altBase={[project.client, project.name]
              .filter(Boolean)
              .join(' — ')}
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

      {/* Related projects — four cards in the same category */}
      <RelatedProjects projects={related} />
    </main>
  )
}
