import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/lib/live'
import { client } from '@/sanity/lib/client'
import {
  diaryPostBySlugQuery,
  allDiaryPostsQuery,
} from '@/sanity/lib/queries'
import DiaryArticle from './DiaryArticle'
import JsonLd from '@/components/JsonLd'
import {
  ogImageFrom,
  imageUrlFrom,
  breadcrumbSchema,
  articleSchema,
} from '@/lib/seo'

export async function generateStaticParams() {
  const posts = await client.fetch(allDiaryPostsQuery)
  return (posts ?? []).map((p: { slug: { current: string } }) => ({
    slug: p.slug.current,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: post } = await sanityFetch({
    query: diaryPostBySlugQuery,
    params: { slug },
  })

  if (!post) return { title: 'Diary' }

  const description = post.excerpt || `${post.title} — from the BoldCrest diary.`
  const path = `/diary/${slug}`
  const ogImage = ogImageFrom(post.coverImage)
  const fullTitle = `${post.title} — BoldCrest`

  return {
    // Bare title; the layout template appends "— BoldCrest" (avoids doubling).
    title: post.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: fullTitle,
      description,
      url: path,
      publishedTime: post.publishedAt,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  }
}

export default async function DiaryPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { data: post } = await sanityFetch({
    query: diaryPostBySlugQuery,
    params: { slug },
  })

  if (!post) notFound()

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Diary', path: '/diary' },
          { name: post.title, path: `/diary/${slug}` },
        ])}
      />
      <JsonLd
        data={articleSchema({
          title: post.title,
          description: post.excerpt,
          path: `/diary/${slug}`,
          image: imageUrlFrom(post.coverImage),
          datePublished: post.publishedAt,
          section: post.category,
        })}
      />
      <DiaryArticle post={post} />
    </>
  )
}
