import { defineQuery } from 'next-sanity'

// Homepage "Selected Works" — the projects manually marked Featured, in the
// manual `featuredOrder` (1 first); ties fall back to newest year / most recent.
export const featuredProjectsQuery = defineQuery(
  `*[_type == "project" && featured == true] | order(coalesce(featuredOrder, 999) asc, year desc, _createdAt desc) [0...6] {
    _id,
    name,
    slug,
    tagline,
    client,
    industry,
    year,
    services,
    thumbnailType,
    thumbnail,
    thumbnailVideo,
    "firstMediaType": media[0]._type
  }`
)

export const allProjectsQuery = defineQuery(
  `*[_type == "project"] | order(orderRank) {
    _id,
    _updatedAt,
    name,
    slug,
    tagline,
    client,
    industry,
    year,
    services,
    thumbnailType,
    thumbnail,
    thumbnailVideo,
    "firstMediaType": media[0]._type
  }`
)

export const projectBySlugQuery = defineQuery(
  `*[_type == "project" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    tagline,
    client,
    industry,
    year,
    services,
    overview,
    challenge,
    solution,
    thumbnailType,
    thumbnail,
    thumbnailVideo,
    order,
    media[] {
      _type,
      _key,
      _type == "videoMedia" => {
        "type": "video",
        vimeoUrl,
        feature,
        half,
        aspectRatio,
        aspectRatioCustom
      },
      _type == "image" => {
        "type": "image",
        asset,
        hotspot,
        crop,
        alt,
        half
      },
      _type == "imageMedia" => {
        "type": "image",
        "asset": coalesce(asset, image.asset),
        "hotspot": coalesce(hotspot, image.hotspot),
        "crop": coalesce(crop, image.crop),
        "alt": coalesce(alt, image.alt),
        half
      }
    }
  }`
)

export const nextProjectQuery = defineQuery(
  `*[_type == "project" && orderRank > $currentRank] | order(orderRank) [0] {
    _id,
    name,
    slug
  }`
)

export const allServicesByCategoryQuery = defineQuery(
  `*[_type == "service"] | order(order asc) {
    _id,
    name,
    slug,
    category,
    order
  }`
)

// Editable copy for the main /services page (singleton).
export const servicesPageQuery = defineQuery(
  `*[_type == "servicesPage"][0] {
    hero,
    disciplinesLabel,
    disciplines,
    stats,
    clientLogosEyebrow,
    processEyebrow,
    processHeading,
    processSteps,
    ctaSection,
    faqs
  }`
)

// Editable copy for a single service detail page (by fixed pageKey).
export const serviceDetailPageQuery = defineQuery(
  `*[_type == "serviceDetailPage" && pageKey == $pageKey][0] {
    hero,
    outcomesHeading,
    outcomes,
    capabilitiesHeading,
    capabilities,
    processHeading,
    processSteps,
    whyUsHeading,
    whyUsItems,
    otherServices,
    ctaSection,
    faqs
  }`
)

export const allPartnersQuery = defineQuery(
  `*[_type == "partner"] | order(orderRank) {
    _id,
    name,
    logo,
    website,
    showOn
  }`
)

export const homepagePartnersQuery = defineQuery(
  `*[_type == "partner" && "homepage" in showOn] | order(orderRank) {
    _id,
    name,
    logo,
    website
  }`
)

export const servicesPartnersQuery = defineQuery(
  `*[_type == "partner" && "services" in showOn] | order(orderRank) {
    _id,
    name,
    logo,
    website
  }`
)

// Projects filtered by service names (for subpages)
export const projectsByServicesQuery = defineQuery(
  `*[_type == "project" && count((services[])[@ in $serviceNames]) > 0] | order(orderRank) [0...6] {
    _id,
    name,
    slug,
    tagline,
    client,
    industry,
    services,
    thumbnail,
    thumbnailType,
    thumbnailVideo
  }`
)

export const allTeamMembersQuery = defineQuery(
  `*[_type == "teamMember"] | order(orderRank) {
    _id,
    name,
    role,
    image
  }`
)

export const allYearPhotosQuery = defineQuery(
  `*[_type == "yearPhoto"] | order(orderRank) {
    _id,
    image,
    year,
    "alt": image.alt
  }`
)

export const latestDiaryPostsQuery = defineQuery(
  `*[_type == "diaryPost"] | order(orderRank) [0...4] {
    _id,
    title,
    slug,
    excerpt,
    category,
    coverImage,
    publishedAt
  }`
)

export const allDiaryPostsQuery = defineQuery(
  `*[_type == "diaryPost"] | order(orderRank) {
    _id,
    _updatedAt,
    title,
    slug,
    excerpt,
    category,
    coverImage,
    publishedAt
  }`
)

export const diaryPostBySlugQuery = defineQuery(
  `*[_type == "diaryPost" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    category,
    coverImage,
    body,
    publishedAt
  }`
)

// Related diary posts — same category first (newest), then a recent-posts
// fallback to fill remaining slots (combined in the page).
export const relatedDiaryPostsQuery = defineQuery(
  `*[_type == "diaryPost" && slug.current != $slug && category == $category] | order(publishedAt desc) [0...5] {
    _id, title, slug, excerpt, category, coverImage, publishedAt
  }`
)

export const moreDiaryPostsQuery = defineQuery(
  `*[_type == "diaryPost" && slug.current != $slug] | order(publishedAt desc) [0...8] {
    _id, title, slug, excerpt, category, coverImage, publishedAt
  }`
)

export const siteSettingsQuery = defineQuery(
  `*[_type == "siteSettings"][0] {
    heroSubtitle,
    footerBigText,
    contactEmail,
    socialLinks[] {
      platform,
      url
    }
  }`
)

// Related projects in the same category (service), excluding the current one
export const relatedProjectsQuery = defineQuery(
  `*[_type == "project" && slug.current != $slug && count((services[])[@ in $serviceNames]) > 0] | order(year desc, _createdAt desc) [0...5] {
    _id,
    name,
    slug,
    tagline,
    client,
    industry,
    services,
    thumbnail,
    thumbnailType,
    thumbnailVideo
  }`
)

// Fallback pool — other recent projects, excluding the current one
export const moreProjectsQuery = defineQuery(
  `*[_type == "project" && slug.current != $slug] | order(year desc, _createdAt desc) [0...5] {
    _id,
    name,
    slug,
    tagline,
    client,
    industry,
    services,
    thumbnail,
    thumbnailType,
    thumbnailVideo
  }`
)
