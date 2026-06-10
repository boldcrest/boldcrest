import { Fragment, type ReactNode } from 'react'

// Trademark / registered / copyright / service-mark glyphs render at the full
// font size, which looks huge in large headings. Wrap them so they shrink and
// sit as a small superscript instead.
const MARK = /[®™©℠]/

export function withSmallMarks(text?: string | null): ReactNode {
  if (!text) return text ?? null
  return text.split(/([®™©℠])/g).map((part, i) =>
    MARK.test(part) ? (
      <sup key={i} className="text-[0.5em] font-normal tracking-normal">
        {part}
      </sup>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )
}
