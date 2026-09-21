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
    defineField({
      name: 'i18n',
      title: 'Translations',
      description:
        'Per-language overrides. Arrays must stay in the SAME ORDER as the English ones above — they are matched by position. Anything left empty falls back to English.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'sq',
          title: 'Albanian (shqip)',
          type: 'object',
          options: { collapsible: true, collapsed: true },
          fields: [
            defineField({ name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string' }),
            defineField({ name: 'heroTitle', title: 'Hero title', type: 'text', rows: 2 }),
            defineField({ name: 'heroSubtitle', title: 'Hero subtitle', type: 'text', rows: 3 }),
            defineField({ name: 'heroCtaLabel', title: 'Hero CTA label', type: 'string' }),
            defineField({ name: 'outcomesHeading', title: 'Outcomes heading', type: 'text', rows: 2 }),
            defineField({ name: 'capabilitiesHeading', title: 'Capabilities heading', type: 'text', rows: 2 }),
            defineField({ name: 'processHeading', title: 'Process heading', type: 'text', rows: 2 }),
            defineField({ name: 'whyUsHeading', title: 'Why-us heading', type: 'text', rows: 2 }),
            defineField({
              name: 'outcomes',
              title: 'Outcomes (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'capabilities',
              title: 'Capabilities (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'name', title: 'Name', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'name' } },
              }],
            }),
            defineField({
              name: 'processSteps',
              title: 'Process steps (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'whyUsItems',
              title: 'Why-us items (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'otherServices',
              title: 'Other services (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'faqs',
              title: 'FAQs (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'question', title: 'Question', type: 'string' }),
                  defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 4 }),
                ],
                preview: { select: { title: 'question' } },
              }],
            }),
          ],
        }),
        defineField({
          name: 'it',
          title: 'Italian (italiano)',
          type: 'object',
          options: { collapsible: true, collapsed: true },
          fields: [
            defineField({ name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string' }),
            defineField({ name: 'heroTitle', title: 'Hero title', type: 'text', rows: 2 }),
            defineField({ name: 'heroSubtitle', title: 'Hero subtitle', type: 'text', rows: 3 }),
            defineField({ name: 'heroCtaLabel', title: 'Hero CTA label', type: 'string' }),
            defineField({ name: 'outcomesHeading', title: 'Outcomes heading', type: 'text', rows: 2 }),
            defineField({ name: 'capabilitiesHeading', title: 'Capabilities heading', type: 'text', rows: 2 }),
            defineField({ name: 'processHeading', title: 'Process heading', type: 'text', rows: 2 }),
            defineField({ name: 'whyUsHeading', title: 'Why-us heading', type: 'text', rows: 2 }),
            defineField({
              name: 'outcomes',
              title: 'Outcomes (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'capabilities',
              title: 'Capabilities (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'name', title: 'Name', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'processSteps',
              title: 'Process steps (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'whyUsItems',
              title: 'Why-us items (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'otherServices',
              title: 'Other services (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
                ],
                preview: { select: { title: 'name' } },
              }],
            }),
            defineField({
              name: 'faqs',
              title: 'FAQs (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'question', title: 'Question', type: 'string' }),
                  defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 4 }),
                ],
                preview: { select: { title: 'question' } },
              }],
            }),
          ],
        }),
        defineField({
          name: 'fr',
          title: 'French (français)',
          type: 'object',
          options: { collapsible: true, collapsed: true },
          fields: [
            defineField({ name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string' }),
            defineField({ name: 'heroTitle', title: 'Hero title', type: 'text', rows: 2 }),
            defineField({ name: 'heroSubtitle', title: 'Hero subtitle', type: 'text', rows: 3 }),
            defineField({ name: 'heroCtaLabel', title: 'Hero CTA label', type: 'string' }),
            defineField({ name: 'outcomesHeading', title: 'Outcomes heading', type: 'text', rows: 2 }),
            defineField({ name: 'capabilitiesHeading', title: 'Capabilities heading', type: 'text', rows: 2 }),
            defineField({ name: 'processHeading', title: 'Process heading', type: 'text', rows: 2 }),
            defineField({ name: 'whyUsHeading', title: 'Why-us heading', type: 'text', rows: 2 }),
            defineField({
              name: 'outcomes',
              title: 'Outcomes (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'capabilities',
              title: 'Capabilities (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'name', title: 'Name', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'processSteps',
              title: 'Process steps (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'whyUsItems',
              title: 'Why-us items (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
                ],
                preview: { select: { title: 'title' } },
              }],
            }),
            defineField({
              name: 'otherServices',
              title: 'Other services (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'title', title: 'Title', type: 'string' }),
                  defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
                ],
                preview: { select: { title: 'name' } },
              }],
            }),
            defineField({
              name: 'faqs',
              title: 'FAQs (same order as above)',
              type: 'array',
              of: [{
                type: 'object',
                fields: [
                  defineField({ name: 'question', title: 'Question', type: 'string' }),
                  defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 4 }),
                ],
                preview: { select: { title: 'question' } },
              }],
            }),
          ],
        }),
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
