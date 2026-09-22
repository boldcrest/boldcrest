import { defineField, defineType } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { NumberedListItem } from '../components/NumberedListItem'
import { PublishToggle } from '../components/PublishToggle'

/**
 * Case Study — campaign results, shown at /case-studies/<slug>.
 *
 * Deliberately its own document type rather than a `layout` flag on `diaryPost`:
 * the field sets barely overlap (one hero KPI + reels + an Instagram-style feed
 * vs. body/category), so sharing a type would mean a Studio form full of
 * conditionally-hidden fields AND would put the diary/related-post queries at
 * risk every time this template changes.
 *
 * HIDING: two independent mechanisms, both of which keep a case study off the
 * public site —
 *   1. Sanity's own draft state (the green/orange PublishToggle at the top of
 *      the form). A never-published document is invisible to the live site,
 *      because `sanityFetch` reads published-only.
 *   2. `unlisted` below — published, reachable by direct link, but kept out of
 *      the /case-studies index and the sitemap, and served `noindex`. That's the
 *      "share it in a pitch before we launch it publicly" state.
 */
export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'media', title: 'Reels & Feed' },
    { name: 'meta', title: 'Visibility & Translations' },
  ],
  fields: [
    orderRankField({ type: 'caseStudy' }),

    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
      group: 'content',
      description: 'Shown above the headline, e.g. "Buka Ime".',
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      group: 'content',
      options: { hotspot: true },
      description: 'Used on the index card and as the social/OG image.',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'One or two lines for the index card and search results.',
    }),

    /* ── The one big number ───────────────────────────────────────────── */
    defineField({
      name: 'kpi',
      title: 'Headline KPI',
      type: 'object',
      group: 'content',
      description: 'The single number this case study is built around.',
      fields: [
        defineField({
          name: 'value',
          title: 'Value',
          type: 'string',
          description: 'Exactly as it should read, e.g. "+312%", "4.2M", "18×".',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'label',
          title: 'Label',
          type: 'string',
          description: 'What the number measures, e.g. "Reach growth in 90 days".',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'context',
          title: 'Context',
          type: 'text',
          rows: 2,
          description: 'Optional one-liner under the label — the baseline or timeframe.',
        }),
      ],
      validation: (rule) => rule.required(),
    }),

    /* ── Optional supporting numbers ──────────────────────────────────── */
    defineField({
      name: 'stats',
      title: 'Supporting stats',
      type: 'array',
      group: 'content',
      description: 'Optional. Up to three smaller numbers shown in a row under the headline KPI.',
      validation: (rule) => rule.max(3),
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'value', title: 'Value', type: 'string' }),
            defineField({ name: 'label', title: 'Label', type: 'string' }),
          ],
          preview: { select: { title: 'value', subtitle: 'label' } },
        },
      ],
    }),

    /* ── The write-up ─────────────────────────────────────────────────── */
    defineField({
      name: 'explanation',
      title: 'The case study',
      type: 'array',
      group: 'content',
      description: 'The challenge, what we did, and why the number moved.',
      of: [
        { type: 'block' },
        {
          type: 'image',
          title: 'Image',
          options: { hotspot: true },
          fields: [
            { name: 'alt', title: 'Alt text', type: 'string' },
            { name: 'caption', title: 'Caption', type: 'string' },
          ],
        },
      ],
    }),

    /* ── Reels ────────────────────────────────────────────────────────── */
    defineField({
      name: 'reels',
      title: 'Reels',
      type: 'array',
      group: 'media',
      description:
        'Vimeo links, shown as a horizontal slider. Typically 4–6. They loop silently in the strip and open with sound when clicked.',
      validation: (rule) => rule.max(10),
      of: [
        {
          type: 'object',
          name: 'reel',
          fields: [
            defineField({
              name: 'vimeoUrl',
              title: 'Vimeo URL',
              type: 'url',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'aspectRatio',
              title: 'Aspect ratio',
              type: 'string',
              initialValue: '9:16',
              description:
                'Reels are 9:16. Set this to the clip’s real shape so it is never cropped.',
              options: {
                list: [
                  { title: '9:16 — vertical reel', value: '9:16' },
                  { title: '4:5 — portrait', value: '4:5' },
                  { title: '1:1 — square', value: '1:1' },
                  { title: '16:9 — landscape', value: '16:9' },
                ],
              },
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional label under the clip.',
            }),
          ],
          preview: {
            select: { title: 'caption', subtitle: 'vimeoUrl' },
            prepare: ({ title, subtitle }) => ({ title: title || 'Reel', subtitle }),
          },
        },
      ],
    }),

    /* ── Instagram-style feed ─────────────────────────────────────────── */
    defineField({
      name: 'feed',
      title: 'Feed',
      type: 'array',
      group: 'media',
      description:
        'Single images laid out as an Instagram grid (3 across). Order here is the order on the page — left to right, top to bottom.',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'alt', title: 'Alt text', type: 'string' }],
        },
      ],
    }),

    /* ── Visibility ───────────────────────────────────────────────────── */
    defineField({
      name: 'unlisted',
      title: 'Unlisted (hidden from the site)',
      type: 'boolean',
      group: 'meta',
      initialValue: true,
      description:
        'ON = reachable only by direct link: kept out of the /case-studies index and the sitemap, and told not to index. Turn OFF to launch it publicly. New case studies start unlisted on purpose.',
    }),

    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
    }),

    /* ── Translations (same pattern as diaryPost) ─────────────────────── */
    defineField({
      name: 'i18n',
      title: 'Translations',
      group: 'meta',
      description:
        'Per-language overrides. Anything left empty falls back to the English field above, so a partially translated case study still renders.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: (['sq', 'it', 'fr'] as const).map((code) =>
        defineField({
          name: code,
          title: { sq: 'Albanian (shqip)', it: 'Italian (italiano)', fr: 'French (français)' }[code],
          type: 'object',
          options: { collapsible: true, collapsed: true },
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'excerpt', title: 'Excerpt', type: 'text' }),
            defineField({ name: 'kpiLabel', title: 'KPI label', type: 'string' }),
            defineField({ name: 'kpiContext', title: 'KPI context', type: 'text', rows: 2 }),
            defineField({
              name: 'explanation',
              title: 'The case study',
              type: 'array',
              of: [{ type: 'block' }],
            }),
          ],
        }),
      ),
    }),
  ],

  orderings: [
    orderRankOrdering,
    {
      title: 'Published Date',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],

  preview: {
    select: { title: 'title', subtitle: 'client', order: 'order', id: '_id', docType: '_type' },
    prepare({ title, subtitle, order, id, docType }) {
      return { title, subtitle, order, id, docType }
    },
  },

  components: { preview: NumberedListItem, input: PublishToggle },
})
