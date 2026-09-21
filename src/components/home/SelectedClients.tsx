'use client'

import { useTranslations } from 'next-intl'

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
  const t = useTranslations('Home')
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
    // wide wordmark / compact-emblem alternating; beverages + auto brands spread apart
    'Coca-Cola', 'ITU', 'Nissan', 'Magniflex', 'Hako', 'Vespa', 'Sprite',
    'Cipriani', 'Renault', 'Lori Caffè', 'Red Bull', 'Piaggio', 'Tepelene',
    'Joka', 'Dacia', 'SachPizza', 'AK Invest', 'Moto Guzzi', 'Alisa Dudaj',
    'Barbaroza', 'Aprilia', 'ACIES', 'Matrix', 'Wolt', 'IONA', 'AutoMita',
    'Fanta', "Let's Drive", 'Ventoro', 'Tomarchio',
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

  // Duplicate each row exactly twice. The marquee keyframes translate from 0 to
  // -50%, so two identical copies make the loop perfectly seamless (the reset
  // point is visually identical to the start — no jump, freeze, or restart).
  const duplicate = (arr: Partner[]) => {
    const result: Partner[] = []
    for (let t = 0; t < 2; t++) {
      arr.forEach((p, i) => {
        result.push({ ...p, _id: `${p._id}-c${t}-${i}` })
      })
    }
    return result
  }

  const row1Items = duplicate(row1)
  const row2Items = duplicate(row2)

  const hasLogo = (p: Partner) => !!p.logo?.asset?._ref

  // No hover interaction — logos sit at a steady opacity.
  const renderPartner = (partner: Partner) => (
    <span
      key={partner._id}
      className="flex shrink-0 items-center px-3.5 py-1 opacity-50 md:px-6"
    >
      {hasLogo(partner) ? (
        <Image
          unoptimized
          src={urlFor(partner.logo!).url()}
          alt={partner.name}
          width={240}
          height={120}
          className="h-[clamp(64px,7vw,96px)] w-auto object-contain"
          style={{ filter: 'var(--zone-logo-filter, brightness(0))' }}
        />
      ) : (
        <span
          className="font-display text-[clamp(1rem,2vw,1.5rem)] font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'var(--zone-fg)' }}
        >
          {partner.name}
        </span>
      )}
    </span>
  )

  // pt-20 (mobile only): the gap above "Trusted by" was just WeDoSection's 40px
  // bottom padding; +80px makes it 120px to match the gap below the logos (this
  // section's 24px pb + ServiceCards' 96px menu-clearance). Desktop unchanged.
  return (
    <section className="overflow-hidden pt-20 pb-[var(--space-md)] md:pt-0 md:pb-[var(--space-2xl)]">
      <div className="mb-[var(--space-lg)] px-[var(--gutter)]">
        <h2 className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--zone-fg-half)' }}>
          {t('trustedBy')}<span className="text-accent">.</span>
        </h2>
        <div className="h-px" style={{ backgroundColor: 'var(--zone-fg-subtle)' }} />
      </div>

      {/* Row 1 — scrolls left. Slower on small screens (higher duration) so the
          logos don't whip past on a narrow viewport; both rows read as a pair. */}
      <div className="relative">
        <div
          className="flex w-max items-center will-change-transform [--mq:32s] md:[--mq:34s]"
          style={{ animation: 'marquee var(--mq) linear infinite' }}
        >
          {row1Items.map(renderPartner)}
        </div>
      </div>

      {/* Row 2 — scrolls right (reverse) */}
      <div className="relative">
        <div
          className="flex w-max items-center will-change-transform [--mq:38s] md:[--mq:40s]"
          style={{ animation: 'marquee-reverse var(--mq) linear infinite' }}
        >
          {row2Items.map(renderPartner)}
        </div>
      </div>

      {/* Zero-height marker at the logos' bottom — ColorTransitionZone reads its
          position to start the mobile dark→light flip when the logos' bottom
          reaches the top third of the screen (see ColorTransitionZone). */}
      <div data-zone-flip-anchor aria-hidden="true" />
    </section>
  )
}
