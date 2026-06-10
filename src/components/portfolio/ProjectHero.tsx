import Link from 'next/link'
import { withSmallMarks } from '@/lib/marks'

interface ProjectHeroProps {
  name: string
  services?: string[]
  industry?: string
  year?: string
}

export default function ProjectHero({
  name,
  services,
  industry,
  year,
}: ProjectHeroProps) {
  // "Client | Title" → two lines
  const titleLines = name.split(' | ')
  const hasMeta = (services && services.length > 0) || !!industry || !!year

  return (
    <section className="px-[var(--gutter)] pt-40">
      <div className="w-full">
        {/* Breadcrumb */}
        <nav className="mb-[var(--space-md)] flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.15em] text-text-tertiary">
          <Link
            href="/work"
            className="transition-colors duration-200 hover:text-white"
          >
            Work
          </Link>
          <span>/</span>
          <span className="text-text-secondary">{name}</span>
        </nav>

        {/* Title (left) + meta (right, stacked & right-aligned) */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.0] tracking-[-0.01em]">
            {titleLines.map((part, i) => (
              <span key={i} className="block">
                {withSmallMarks(part)}
                {i === titleLines.length - 1 && (
                  <span className="text-accent">.</span>
                )}
              </span>
            ))}
          </h1>

          {hasMeta && (
            <div className="shrink-0 text-[0.7rem] font-semibold uppercase leading-[2.1] tracking-[0.2em] text-text-tertiary md:text-right">
              {/* Category (service) — links to the filtered Work page */}
              {services && services.length > 0 && (
                <div>
                  {services.map((s, i) => (
                    <span key={s}>
                      {i > 0 && ', '}
                      <Link
                        href={`/work?service=${encodeURIComponent(s)}`}
                        className="transition-colors duration-200 hover:text-white"
                      >
                        {s}
                      </Link>
                    </span>
                  ))}
                </div>
              )}
              {/* Industry — links to the filtered Work page */}
              {industry && (
                <div>
                  <Link
                    href={`/work?industry=${encodeURIComponent(industry)}`}
                    className="transition-colors duration-200 hover:text-white"
                  >
                    {industry}
                  </Link>
                </div>
              )}
              {year && <div>{year}</div>}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mt-[var(--space-xl)] border-t border-border" />
      </div>
    </section>
  )
}
