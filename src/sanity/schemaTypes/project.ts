import { defineField, defineType } from 'sanity'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
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
          ],
          preview: {
            select: { url: 'vimeoUrl' },
            prepare({ url }) {
              return { title: 'Video', subtitle: url }
            },
          },
        },
        {
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
        },
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show this project on the homepage Featured section',
      initialValue: false,
    }),
    defineField({
      name: 'order',
      title: 'Order',
      type: 'number',
    }),
  ],
  orderings: [
    {
      title: 'Manual Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'name', subtitle: 'client', media: 'thumbnail' },
  },
})
