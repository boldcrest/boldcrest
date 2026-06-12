'use client'

import { useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'

interface Partner {
  _id: string
  name: string
  logo?: { asset: { _ref: string } }
  website?: string
}

interface SelectedClientsProps {
  partners: Partner[]
}

export default function SelectedClients({ partners }: SelectedClientsProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const displayPartners =
    partners.length > 0
      ? partners
      : [
          { _id: '1', name: 'Vodafone' },
          { _id: '2', name: 'Raiffeisen Bank' },
          { _id: '3', name: 'Tirana Bank' },
          { _id: '4', name: 'RedBull' },
          { _id: '5', name: 'Credins Bank' },
          { _id: '6', name: 'KESH' },
          { _id: '7', name: 'Passerelle' },
          { _id: '8', name: 'Altus' },
        ]

  // Homepage display order — interleave wide wordmarks with compact/emblem
  // logos so similar shapes aren't grouped together. Independent of the Sanity
  // `order` field (which the Services page still uses).
  const HOME_ORDER = [
    // wide wordmark / compact-emblem alternating; beverages spread apart
    'Coca-Cola', 'ITU', 'Magniflex', 'Hako', 'Sprite', 'Cipriani', 'Lori Caffè',
    'Red Bull', 'Tepelene', 'Joka', 'SachPizza', 'AK Invest', 'Alisa Dudaj',
    'Barbaroza', 'ACIES', 'Matrix', 'Wolt', 'IONA', 'AutoMita', 'Fanta',
    "Let's Drive", 'Ventoro', 'Tomarchio',
  ]
  const rank = (name: string) => {
    const i = HOME_ORDER.indexOf(name)
    return i === -1 ? HOME_ORDER.length : i
  }
  const ordered = [...displayPartners].sort((a, b) => rank(a.name) - rank(b.name))

  // Split the interleaved list across the two rows so each row carries a mix
  // of wide and compact logos.
  const mid = Math.ceil(ordered.length / 2)
  const row1 = ordered.slice(0, mid)
  const row2 = ordered.slice(mid)

  const repeat = (arr: Partner[], times: number) => {
    const result: Partner[] = []
    for (let t = 0; t < times; t++) {
      arr.forEach((p, i) => {
        result.push({ ...p, _id: `${p._id}-r${t}-${i}` })
      })
    }
    return result
  }

  const row1Items = repeat(row1, 4)
  const row2Items = repeat(row2, 4)

  const hasLogo = (p: Partner) => !!p.logo?.asset?._ref

  const renderPartner = (partner: Partner) => (
    <span
      key={partner._id}
      className="shrink-0 cursor-default px-6 py-1 transition-opacity duration-300 flex items-center"
      style={{
        opacity: hovered
          ? hovered === partner.name
            ? 1
            : 0.2
          : 0.5,
      }}
      onMouseEnter={() => setHovered(partner.name)}
    >
      {hasLogo(partner) ? (
        <Image
          unoptimized
          src={urlFor(partner.logo!).url()}
          alt={partner.name}
          width={375}
          height={150}
          className="h-[150px] w-auto max-w-[200px] object-contain"
          style={{ filter: 'var(--zone-logo-filter, brightness(0))' }}
        />
      ) : (
        <span
          className="font-display text-[clamp(1.2rem,2.5vw,2rem)] font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'var(--zone-fg)' }}
        >
          {partner.name}
        </span>
      )}
    </span>
  )

  return (
    <section className="pb-[var(--space-2xl)] overflow-hidden">
      <div className="px-[var(--gutter)] mb-[var(--space-lg)]">
        <h2 className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--zone-fg-half)' }}>
          Trusted by the ambitious<span className="text-accent">.</span>
        </h2>
        <div className="h-px" style={{ backgroundColor: 'var(--zone-fg-subtle)' }} />
      </div>

      {/* Row 1 — scrolls left (kept tight to row 2 so they read as a pair) */}
      <div
        className="relative"
        onMouseLeave={() => setHovered(null)}
      >
        <div className="flex animate-[marquee_35s_linear_infinite] will-change-transform items-center">
          {row1Items.map(renderPartner)}
        </div>
      </div>

      {/* Row 2 — scrolls right (reverse) */}
      <div
        className="relative"
        onMouseLeave={() => setHovered(null)}
      >
        <div className="flex animate-[marquee-reverse_40s_linear_infinite] will-change-transform items-center">
          {row2Items.map(renderPartner)}
        </div>
      </div>
    </section>
  )
}
