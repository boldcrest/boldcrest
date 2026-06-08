'use client'

import { PortableText, type PortableTextBlock } from '@portabletext/react'

interface ProjectDetailsProps {
  overview?: PortableTextBlock[]
  challenge?: PortableTextBlock[]
  solution?: PortableTextBlock[]
}

const column = (title: string, content?: PortableTextBlock[]) => {
  if (!content || content.length === 0) return null
  return (
    <div key={title}>
      <h2 className="mb-[var(--space-sm)] text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
        {title}
      </h2>
      <div className="prose-custom text-[0.95rem] leading-[1.8] text-text-secondary">
        <PortableText value={content} />
      </div>
    </div>
  )
}

export default function ProjectDetails({
  overview,
  challenge,
  solution,
}: ProjectDetailsProps) {
  const cols = [
    column('Overview', overview),
    column('Challenge', challenge),
    column('Solution', solution),
  ].filter(Boolean)

  if (cols.length === 0) return null

  return (
    <section className="border-t border-border px-[var(--gutter)] py-[var(--space-2xl)]">
      <div className="mx-auto grid max-w-[var(--max-width)] gap-[var(--space-xl)] md:grid-cols-3">
        {cols}
      </div>
    </section>
  )
}
