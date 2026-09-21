import { defineField, defineType } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { MediaArrayItem } from '../components/MediaArrayItem'
import { NumberedListItem } from '../components/NumberedListItem'
import { PublishToggle } from '../components/PublishToggle'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    orderRankField({ type: 'project' }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
    }),
    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
    }),
    defineField({
      name: 'industry',
      title: 'Industry',
      type: 'string',
      options: {
        list: [
          { title: 'Construction', value: 'Construction' },
          { title: 'Fashion', value: 'Fashion' },
          { title: 'Finance', value: 'Finance' },
          { title: 'Food & Beverage', value: 'Food & Beverage' },
          { title: 'Health & Beauty', value: 'Health & Beauty' },
          { title: 'Home & Appliances', value: 'Home & Appliances' },
          { title: 'HoReCa', value: 'HoReCa' },
          { title: 'NGO', value: 'NGO' },
          { title: 'Our Crests', value: 'Our Crests' },
          { title: 'Services', value: 'Services' },
          { title: 'Tech', value: 'Tech' },
        ],
      },
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'string',
    }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'Ads Management', value: 'Ads Management' },
              { title: 'Branding', value: 'Branding' },
              { title: 'Creative Advertising', value: 'Creative Advertising' },
              { title: 'Packaging', value: 'Packaging' },
              { title: 'Photography', value: 'Photography' },
              { title: 'Social Media Management', value: 'Social Media Management' },
              { title: 'Television Commercials', value: 'Television Commercials' },
              { title: 'Videography', value: 'Videography' },
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'overview',
      title: 'Overview',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'challenge',
      title: 'Challenge',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'i18n',
      title: 'Translations',
      description:
        'Per-language overrides. Anything left empty falls back to the English field above, so a partially translated project still renders.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'sq',
          title: 'Albanian (shqip)',
          type: 'object',
          options: { collapsible: true, collapsed: true },
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
            defineField({ name: 'overview', title: 'Overview', type: 'array', of: [{ type: 'block' }] }),
            defineField({ name: 'challenge', title: 'Challenge', type: 'array', of: [{ type: 'block' }] }),
            defineField({ name: 'solution', title: 'Solution', type: 'array', of: [{ type: 'block' }] }),
          ],
        }),
        defineField({
          name: 'it',
          title: 'Italian (italiano)',
          type: 'object',
          options: { collapsible: true, collapsed: true },
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
            defineField({ name: 'overview', title: 'Overview', type: 'array', of: [{ type: 'block' }] }),
            defineField({ name: 'challenge', title: 'Challenge', type: 'array', of: [{ type: 'block' }] }),
            defineField({ name: 'solution', title: 'Solution', type: 'array', of: [{ type: 'block' }] }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'solution',
      title: 'Solution',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'thumbnailType',
      title: 'Thumbnail Type',
      type: 'string',
      options: {
        list: [
          { title: 'Image', value: 'image' },
          { title: 'Vimeo Video', value: 'video' },
        ],
        layout: 'radio',
      },
      initialValue: 'image',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail Image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text (SEO)',
          type: 'string',
          description: 'Describe the image for search engines & screen readers.',
        }),
      ],
      hidden: ({ parent }) => parent?.thumbnailType === 'video',
    }),
    defineField({
      name: 'thumbnailVideo',
      title: 'Thumbnail Vimeo URL',
      type: 'url',
      description:
        'A silent looping video used as the cover (and, by default, as the first slide).',
      hidden: ({ parent }) => parent?.thumbnailType !== 'video',
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'videoMedia',
          title: 'Video',
          fields: [
            defineField({
              name: 'type',
              title: 'Type',
              type: 'string',
              initialValue: 'video',
              readOnly: true,
              hidden: true,
            }),
            defineField({
              name: 'vimeoUrl',
              title: 'Vimeo URL',
              type: 'url',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'feature',
              title: 'Full Player',
              type: 'boolean',
              description:
                'On = full player with sound & controls (click to play). Off = silent looping background video.',
              initialValue: false,
            }),
            defineField({
              name: 'half',
              title: 'Side by Side',
              type: 'boolean',
              description:
                'Turn this on for two consecutive media items (videos or images) to place them side by side (no gap).',
              initialValue: false,
            }),
            defineField({
              name: 'aspectRatio',
              title: 'Aspect ratio',
              type: 'string',
              description:
                'Default uses the video’s real shape from Vimeo. Override only to force a specific box.',
              options: {
                list: [
                  { title: 'Auto (from Vimeo)', value: 'auto' },
                  { title: '16:9 — widescreen', value: '16:9' },
                  { title: '9:16 — vertical', value: '9:16' },
                  { title: '1:1 — square', value: '1:1' },
                  { title: '4:5 — portrait', value: '4:5' },
                  { title: '4:3', value: '4:3' },
                  { title: '21:9 — cinematic', value: '21:9' },
                  { title: 'Custom…', value: 'custom' },
                ],
              },
              initialValue: 'auto',
            }),
            defineField({
              name: 'aspectRatioCustom',
              title: 'Custom aspect ratio',
              type: 'string',
              description:
                'Width:height — e.g. 2.35:1, 1.85:1, 3:2 — or a single number like 2.35.',
              hidden: ({ parent }) => parent?.aspectRatio !== 'custom',
              validation: (rule) =>
                rule.custom((val, ctx) => {
                  const parent = ctx.parent as { aspectRatio?: string } | undefined
                  if (parent?.aspectRatio !== 'custom') return true
                  if (!val) return 'Enter a custom aspect ratio, e.g. 2.35:1'
                  return /^\s*\d+(\.\d+)?(\s*:\s*\d+(\.\d+)?)?\s*$/.test(val)
                    ? true
                    : 'Use W:H (e.g. 2.35:1) or a single number (e.g. 2.35)'
                }),
            }),
          ],
          preview: {
            select: { url: 'vimeoUrl', feature: 'feature', half: 'half' },
            prepare({ url, feature, half }) {
              const tags = [feature && 'Full Player', half && 'Side by Side'].filter(Boolean)
              return {
                title: tags.length ? `Video — ${tags.join(' · ')}` : 'Video',
                subtitle: url,
              }
            },
          },
          components: { item: MediaArrayItem },
        },
        {
          type: 'object',
          name: 'imageMedia',
          title: 'Image',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Alt text (SEO)',
                  type: 'string',
                  description: 'Describe the image for search engines & screen readers.',
                }),
              ],
            }),
            defineField({
              name: 'half',
              title: 'Side by Side',
              type: 'boolean',
              description:
                'Turn this on for two consecutive images to place them side by side (no gap). Off = normal full-width slide.',
              initialValue: false,
            }),
            // Legacy fields kept so existing items stay valid; not user-editable.
            defineField({ name: 'aspectRatio', type: 'string', hidden: true, readOnly: true }),
            defineField({ name: 'type', type: 'string', hidden: true, readOnly: true }),
          ],
          preview: {
            select: { media: 'image', half: 'half' },
            prepare({ media, half }) {
              return { title: half ? 'Image — Side by Side' : 'Image', media }
            },
          },
          components: { item: MediaArrayItem },
        },
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show this project on the homepage Featured (Selected Works) section.',
      initialValue: false,
    }),
    defineField({
      name: 'featuredOrder',
      title: 'Featured order (homepage)',
      type: 'number',
      description:
        'Position in the homepage Featured section — 1 shows first, 2 next, and so on. Only used when Featured is on.',
      hidden: ({ parent }) => !parent?.featured,
    }),
    defineField({
      name: 'order',
      title: 'Order (manual)',
      type: 'number',
      description:
        'Drag-and-drop in the list is the live order. This number is a manual reference/backup only — editing it does not move the project.',
    }),
  ],
  orderings: [orderRankOrdering],
  preview: {
    select: {
      title: 'name',
      subtitle: 'client',
      media: 'thumbnail',
      order: 'order',
      id: '_id',
      docType: '_type',
    },
    prepare({ title, subtitle, media, order, id, docType }) {
      // Title stays clean; the rest feeds the live number column.
      const value = { title, subtitle, media, order, id, docType }
      return value
    },
  },
  components: { preview: NumberedListItem, input: PublishToggle },
})
