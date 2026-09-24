import { routing } from '@/i18n/routing'
import { setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/lib/live'
import { client, CMS_REVALIDATE } from '@/sanity/lib/client'
import {
  diaryPostBySlugQuery,
  allDiaryPostsQuery,
  relatedDiaryPostsQuery,
  moreDiaryPostsQuery,
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
  const posts = await client.fetch(allDiaryPostsQuery, {
    locale: routing.defaultLocale,
  }, { next: { revalidate: CMS_REVALIDATE } })
  // Cross product with the locales: returning slugs alone leaves the `locale`
  // segment unresolved, and Next silently drops the whole route to dynamic
  // rendering instead of prerendering it.
  return routing.locales.flatMap((locale) =>
    (posts ?? []).map((p: { slug: { current: string } }) => ({
      locale,
      slug: p.slug.current,
    })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const { data: post } = await sanityFetch({
    query: diaryPostBySlugQuery,
    params: { slug, locale },
  })

  if (!post) return { title: 'Diary' }

  const description = post.excerpt || `${post.title}, from the BoldCrest diary.`
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
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const { data: post } = await sanityFetch({
    query: diaryPostBySlugQuery,
    params: { slug, locale },
  })

  if (!post) notFound()

  // MORE DIARY — same category first, then fill with the most recent posts
  // (dedup against the current post + already-picked related), up to 3.
  const [{ data: related }, { data: more }] = await Promise.all([
    sanityFetch({
      query: relatedDiaryPostsQuery,
      params: { slug, category: post.category ?? '', locale },
    }),
    sanityFetch({ query: moreDiaryPostsQuery, params: { slug, locale } }),
  ])
  const seen = new Set<string>()
  const morePosts = [...(related ?? []), ...(more ?? [])]
    .filter((p) => (seen.has(p._id) ? false : seen.add(p._id)))
    .slice(0, 5)

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
      <DiaryArticle post={post} morePosts={morePosts} />
    </>
  )
}
