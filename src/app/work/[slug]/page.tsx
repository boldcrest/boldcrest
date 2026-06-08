import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/lib/live'
import { client } from '@/sanity/lib/client'
import {
  projectBySlugQuery,
  nextProjectQuery,
  allProjectsQuery,
} from '@/sanity/lib/queries'
import ProjectHero from '@/components/portfolio/ProjectHero'
import ProjectDetails from '@/components/portfolio/ProjectDetails'
import ContentStack from '@/components/portfolio/ContentStack'
import NextProject from '@/components/portfolio/NextProject'

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

  // Fetch next project
  const { data: nextProject } = await sanityFetch({
    query: nextProjectQuery,
    params: { currentOrder: project.order ?? 0 },
  })

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

      {/* Portfolio media — centred, with the thumbnail navigator in the margin */}
      <section className="px-[var(--gutter)] pb-[var(--space-2xl)] pt-[var(--space-xl)]">
        <div className="relative mx-auto max-w-[var(--max-width)]">
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

      {/* Next Project CTA */}
      {nextProject && (
        <NextProject name={nextProject.name} slug={nextProject.slug} />
      )}
    </main>
  )
}
