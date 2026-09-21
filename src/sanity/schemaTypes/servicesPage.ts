import { defineField, defineType } from 'sanity'

// Singleton: the main /services hub page.
export const servicesPage = defineType({
  name: 'servicesPage',
  title: 'Services Page',
  type: 'document',
  fields: [
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow label', type: 'string' }),
        defineField({
          name: 'lines',
          title: 'Headline lines',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'Each line animates in on its own. 4 lines currently.',
        }),
      ],
    }),
    defineField({
      name: 'disciplinesLabel',
      title: 'Disciplines — section label',
      type: 'string',
    }),
    defineField({
      name: 'disciplines',
      title: 'Discipline cards',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'number', title: 'Number', type: 'string' }),
            defineField({ name: 'heading', title: 'Heading', type: 'string' }),
            defineField({ name: 'abbr', title: 'Abbreviation', type: 'string' }),
            defineField({ name: 'ctaLabel', title: 'CTA label', type: 'string' }),
            defineField({
              name: 'tags',
              title: 'Tags',
              type: 'array',
              of: [{ type: 'string' }],
            }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 4 }),
          ],
          preview: { select: { title: 'heading', subtitle: 'number' } },
        },
      ],
    }),
    defineField({
      name: 'stats',
      title: 'Stats — labels',
      type: 'object',
      description: 'The numbers are auto-calculated; only the labels are editable.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'projectsLabel', title: 'Projects label', type: 'string' }),
        defineField({ name: 'partnersLabel', title: 'Partners label', type: 'string' }),
        defineField({ name: 'daysLabel', title: 'Days active label', type: 'string' }),
      ],
    }),
    defineField({
      name: 'clientLogosEyebrow',
      title: 'Client logos — eyebrow',
      type: 'string',
    }),
    defineField({
      name: 'processEyebrow',
      title: 'Process — eyebrow',
      type: 'string',
    }),
    defineField({
      name: 'processHeading',
      title: 'Process — heading',
      type: 'string',
    }),
    defineField({
      name: 'processSteps',
      title: 'Process steps',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'number', title: 'Number', type: 'string' }),
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'title', subtitle: 'number' } },
        },
      ],
    }),
    defineField({
      name: 'ctaSection',
      title: 'CTA section (above the FAQ)',
      type: 'object',
      fields: [
        defineField({ name: 'label', title: 'Eyebrow label', type: 'string' }),
        defineField({ name: 'heading', title: 'Heading', type: 'text', rows: 2 }),
        defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
        defineField({ name: 'buttonLabel', title: 'Button label', type: 'string' }),
      ],
    }),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'question', title: 'Question', type: 'string' }),
            defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 4 }),
          ],
          preview: { select: { title: 'question' } },
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Services Page' }
    },
  },
})
