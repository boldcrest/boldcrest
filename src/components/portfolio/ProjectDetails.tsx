'use client'

import { useTranslations } from 'next-intl'

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
  const t = useTranslations('Work')
  const cols = [
    column(t('overview'), overview),
    column(t('challenge'), challenge),
    column(t('solution'), solution),
  ].filter(Boolean)

  if (cols.length === 0) return null

  return (
    <section className="px-[var(--gutter)] pb-[var(--space-lg)] pt-[var(--space-lg)] md:pt-[var(--space-xl)]">
      <div className="grid w-full gap-[var(--space-xl)] md:grid-cols-3">
        {cols}
      </div>
    </section>
  )
}
