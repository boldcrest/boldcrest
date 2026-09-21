import { defineField, defineType } from 'sanity'
import { orderRankField, orderRankOrdering } from '@sanity/orderable-document-list'
import { NumberedListItem } from '../components/NumberedListItem'
import { PublishToggle } from '../components/PublishToggle'

export const diaryPost = defineType({
  name: 'diaryPost',
  title: 'Diary Post',
  type: 'document',
  fields: [
    orderRankField({ type: 'diaryPost' }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Insights', value: 'Insights' },
          { title: 'Branding', value: 'Branding' },
          { title: 'Design', value: 'Design' },
          { title: 'Motion', value: 'Motion' },
          { title: 'Culture', value: 'Culture' },
          { title: 'Strategy', value: 'Strategy' },
        ],
      },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
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
    defineField({
      name: 'i18n',
      title: 'Translations',
      description:
        'Per-language overrides. Anything left empty falls back to the English field above, so a partially translated document still renders.',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'sq',
          title: 'Albanian (shqip)',
          type: 'object',
          options: { collapsible: true, collapsed: true },
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'excerpt', title: 'Excerpt', type: 'text' }),
            defineField({ name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }] }),
          ],
        }),
        defineField({
          name: 'it',
          title: 'Italian (italiano)',
          type: 'object',
          options: { collapsible: true, collapsed: true },
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'excerpt', title: 'Excerpt', type: 'text' }),
            defineField({ name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }] }),
          ],
        }),
        defineField({
          name: 'fr',
          title: 'French (français)',
          type: 'object',
          options: { collapsible: true, collapsed: true },
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string' }),
            defineField({ name: 'excerpt', title: 'Excerpt', type: 'text' }),
            defineField({ name: 'body', title: 'Body', type: 'array', of: [{ type: 'block' }] }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'order',
      title: 'Order (manual)',
      type: 'number',
      description: 'Drag-and-drop is the live order; this number is a manual reference/backup only.',
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
    select: { title: 'title', subtitle: 'category', order: 'order', id: '_id', docType: '_type' },
    prepare({ title, subtitle, order, id, docType }) {
      const value = { title, subtitle, order, id, docType }
      return value
    },
  },
  components: { preview: NumberedListItem, input: PublishToggle },
})
