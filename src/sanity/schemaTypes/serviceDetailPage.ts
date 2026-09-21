import { defineField, defineType } from 'sanity'

// One document per service detail page (Brand Development / Still & Motion /
// Communication). `pageKey` ties the doc to its fixed route.
export const serviceDetailPage = defineType({
  name: 'serviceDetailPage',
  title: 'Service Detail Page',
  type: 'document',
  fields: [
    defineField({
      name: 'pageKey',
      title: 'Page',
      type: 'string',
      description: 'Which detail page this content drives. Do not change.',
      options: {
        list: [
          { title: 'Brand Development', value: 'brand-development' },
          { title: 'Still & Motion', value: 'still-motion' },
          { title: 'Communication', value: 'communication' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      options: { collapsible: true, collapsed: false },
      fields: [
        defineField({ name: 'label', title: 'Eyebrow label', type: 'string' }),
        defineField({ name: 'title', title: 'Title', type: 'text', rows: 2 }),
        defineField({ name: 'subtitle', title: 'Subtitle', type: 'text', rows: 4 }),
        defineField({ name: 'ctaLabel', title: 'CTA button label', type: 'string' }),
      ],
    }),
    defineField({
      name: 'outcomesHeading',
      title: 'Outcomes — heading',
      type: 'string',
    }),
    defineField({
      name: 'outcomes',
      title: 'Outcomes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'title' } },
        },
      ],
    }),
    defineField({
      name: 'capabilitiesHeading',
      title: 'Capabilities — heading',
      type: 'string',
    }),
    defineField({
      name: 'capabilities',
      title: 'Capabilities',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'link', title: 'Link', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 4 }),
          ],
          preview: { select: { title: 'name' } },
        },
      ],
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
      name: 'whyUsHeading',
      title: 'Why us — heading',
      type: 'string',
    }),
    defineField({
      name: 'whyUsItems',
      title: 'Why us — items',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'title' } },
        },
      ],
    }),
    defineField({
      name: 'otherServices',
      title: 'Other services (footer links)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'description', title: 'Description', type: 'string' }),
          ],
          preview: { select: { title: 'title' } },
        },
      ],
      validation: (rule) => rule.max(2),
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
    select: { key: 'pageKey' },
    prepare({ key }) {
      const titles: Record<string, string> = {
        'brand-development': 'Brand Development',
        'still-motion': 'Still & Motion',
        communication: 'Communication',
      }
      return { title: titles[key] || 'Service Detail Page', subtitle: 'Service Detail Page' }
    },
  },
})
