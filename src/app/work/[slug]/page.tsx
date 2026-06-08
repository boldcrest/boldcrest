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

  if (!project) return { title: 'Project — BoldCrest' }

  return {
    title: `${project.name} — BoldCrest`,
    description: project.tagline || `${project.name} project by BoldCrest.`,
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
