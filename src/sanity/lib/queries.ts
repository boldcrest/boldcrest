import { defineQuery } from 'next-sanity'

// Homepage "Selected Works" — the projects manually marked Featured, in the
// manual `featuredOrder` (1 first); ties fall back to newest year / most recent.
export const featuredProjectsQuery = defineQuery(
  `*[_type == "project" && featured == true] | order(coalesce(featuredOrder, 999) asc, year desc, _createdAt desc) [0...6] {
    _id,
    "name": coalesce(select($locale == "sq" => i18n.sq.name, $locale == "it" => i18n.it.name, $locale == "fr" => i18n.fr.name), name),
    slug,
    "tagline": coalesce(select($locale == "sq" => i18n.sq.tagline, $locale == "it" => i18n.it.tagline, $locale == "fr" => i18n.fr.tagline), tagline),
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
    "name": coalesce(select($locale == "sq" => i18n.sq.name, $locale == "it" => i18n.it.name, $locale == "fr" => i18n.fr.name), name),
    slug,
    "tagline": coalesce(select($locale == "sq" => i18n.sq.tagline, $locale == "it" => i18n.it.tagline, $locale == "fr" => i18n.fr.tagline), tagline),
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
    "name": coalesce(select($locale == "sq" => i18n.sq.name, $locale == "it" => i18n.it.name, $locale == "fr" => i18n.fr.name), name),
    slug,
    "tagline": coalesce(select($locale == "sq" => i18n.sq.tagline, $locale == "it" => i18n.it.tagline, $locale == "fr" => i18n.fr.tagline), tagline),
    client,
    industry,
    year,
    services,
    "overview": coalesce(select($locale == "sq" => i18n.sq.overview, $locale == "it" => i18n.it.overview, $locale == "fr" => i18n.fr.overview), overview),
    "challenge": coalesce(select($locale == "sq" => i18n.sq.challenge, $locale == "it" => i18n.it.challenge, $locale == "fr" => i18n.fr.challenge), challenge),
    "solution": coalesce(select($locale == "sq" => i18n.sq.solution, $locale == "it" => i18n.it.solution, $locale == "fr" => i18n.fr.solution), solution),
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
    "name": coalesce(select($locale == "sq" => i18n.sq.name, $locale == "it" => i18n.it.name, $locale == "fr" => i18n.fr.name), name),
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
    "hero": {
      "eyebrow": coalesce(select($locale == "sq" => i18n.sq.heroEyebrow, $locale == "it" => i18n.it.heroEyebrow, $locale == "fr" => i18n.fr.heroEyebrow), hero.eyebrow),
      "lines": coalesce(select($locale == "sq" => i18n.sq.heroLines, $locale == "it" => i18n.it.heroLines, $locale == "fr" => i18n.fr.heroLines), hero.lines)
    },
    "disciplinesLabel": coalesce(select($locale == "sq" => i18n.sq.disciplinesLabel, $locale == "it" => i18n.it.disciplinesLabel, $locale == "fr" => i18n.fr.disciplinesLabel), disciplinesLabel),
    "disciplines": disciplines[]{
      ...,
      "heading": coalesce(select($locale == "sq" => ^.i18n.sq.disciplines[@._key == ^._key][0].heading, $locale == "it" => ^.i18n.it.disciplines[@._key == ^._key][0].heading, $locale == "fr" => ^.i18n.fr.disciplines[@._key == ^._key][0].heading), heading),
      "description": coalesce(select($locale == "sq" => ^.i18n.sq.disciplines[@._key == ^._key][0].description, $locale == "it" => ^.i18n.it.disciplines[@._key == ^._key][0].description, $locale == "fr" => ^.i18n.fr.disciplines[@._key == ^._key][0].description), description),
      "tags": coalesce(select($locale == "sq" => ^.i18n.sq.disciplines[@._key == ^._key][0].tags, $locale == "it" => ^.i18n.it.disciplines[@._key == ^._key][0].tags, $locale == "fr" => ^.i18n.fr.disciplines[@._key == ^._key][0].tags), tags),
      "ctaLabel": coalesce(select($locale == "sq" => ^.i18n.sq.disciplines[@._key == ^._key][0].ctaLabel, $locale == "it" => ^.i18n.it.disciplines[@._key == ^._key][0].ctaLabel, $locale == "fr" => ^.i18n.fr.disciplines[@._key == ^._key][0].ctaLabel), ctaLabel)
    },
    "stats": coalesce(select($locale == "sq" => i18n.sq.stats, $locale == "it" => i18n.it.stats, $locale == "fr" => i18n.fr.stats), stats),
    "clientLogosEyebrow": coalesce(select($locale == "sq" => i18n.sq.clientLogosEyebrow, $locale == "it" => i18n.it.clientLogosEyebrow, $locale == "fr" => i18n.fr.clientLogosEyebrow), clientLogosEyebrow),
    "processEyebrow": coalesce(select($locale == "sq" => i18n.sq.processEyebrow, $locale == "it" => i18n.it.processEyebrow, $locale == "fr" => i18n.fr.processEyebrow), processEyebrow),
    "processHeading": coalesce(select($locale == "sq" => i18n.sq.processHeading, $locale == "it" => i18n.it.processHeading, $locale == "fr" => i18n.fr.processHeading), processHeading),
    "processSteps": processSteps[]{
      ...,
      "title": coalesce(select($locale == "sq" => ^.i18n.sq.processSteps[@._key == ^._key][0].title, $locale == "it" => ^.i18n.it.processSteps[@._key == ^._key][0].title, $locale == "fr" => ^.i18n.fr.processSteps[@._key == ^._key][0].title), title),
      "description": coalesce(select($locale == "sq" => ^.i18n.sq.processSteps[@._key == ^._key][0].description, $locale == "it" => ^.i18n.it.processSteps[@._key == ^._key][0].description, $locale == "fr" => ^.i18n.fr.processSteps[@._key == ^._key][0].description), description)
    },
    ctaSection,
    "faqs": faqs[]{
      ...,
      "question": coalesce(select($locale == "sq" => ^.i18n.sq.faqs[@._key == ^._key][0].question, $locale == "it" => ^.i18n.it.faqs[@._key == ^._key][0].question, $locale == "fr" => ^.i18n.fr.faqs[@._key == ^._key][0].question), question),
      "answer": coalesce(select($locale == "sq" => ^.i18n.sq.faqs[@._key == ^._key][0].answer, $locale == "it" => ^.i18n.it.faqs[@._key == ^._key][0].answer, $locale == "fr" => ^.i18n.fr.faqs[@._key == ^._key][0].answer), answer)
    }
  }`
)

// Editable copy for a single service detail page (by fixed pageKey).
export const serviceDetailPageQuery = defineQuery(
  `*[_type == "serviceDetailPage" && pageKey == $pageKey][0] {
    "hero": {
      "label": coalesce(select($locale == "sq" => i18n.sq.heroEyebrow, $locale == "it" => i18n.it.heroEyebrow, $locale == "fr" => i18n.fr.heroEyebrow), hero.label),
      "title": coalesce(select($locale == "sq" => i18n.sq.heroTitle, $locale == "it" => i18n.it.heroTitle, $locale == "fr" => i18n.fr.heroTitle), hero.title),
      "subtitle": coalesce(select($locale == "sq" => i18n.sq.heroSubtitle, $locale == "it" => i18n.it.heroSubtitle, $locale == "fr" => i18n.fr.heroSubtitle), hero.subtitle),
      "ctaLabel": coalesce(select($locale == "sq" => i18n.sq.heroCtaLabel, $locale == "it" => i18n.it.heroCtaLabel, $locale == "fr" => i18n.fr.heroCtaLabel), hero.ctaLabel)
    },
    "outcomesHeading": coalesce(select($locale == "sq" => i18n.sq.outcomesHeading, $locale == "it" => i18n.it.outcomesHeading, $locale == "fr" => i18n.fr.outcomesHeading), outcomesHeading),
    "outcomes": outcomes[]{
      ...,
      "title": coalesce(select($locale == "sq" => ^.i18n.sq.outcomes[@._key == ^._key][0].title, $locale == "it" => ^.i18n.it.outcomes[@._key == ^._key][0].title, $locale == "fr" => ^.i18n.fr.outcomes[@._key == ^._key][0].title), title),
      "description": coalesce(select($locale == "sq" => ^.i18n.sq.outcomes[@._key == ^._key][0].description, $locale == "it" => ^.i18n.it.outcomes[@._key == ^._key][0].description, $locale == "fr" => ^.i18n.fr.outcomes[@._key == ^._key][0].description), description)
    },
    "capabilitiesHeading": coalesce(select($locale == "sq" => i18n.sq.capabilitiesHeading, $locale == "it" => i18n.it.capabilitiesHeading, $locale == "fr" => i18n.fr.capabilitiesHeading), capabilitiesHeading),
    "capabilities": capabilities[]{
      ...,
      "name": coalesce(select($locale == "sq" => ^.i18n.sq.capabilities[@._key == ^._key][0].name, $locale == "it" => ^.i18n.it.capabilities[@._key == ^._key][0].name, $locale == "fr" => ^.i18n.fr.capabilities[@._key == ^._key][0].name), name),
      "description": coalesce(select($locale == "sq" => ^.i18n.sq.capabilities[@._key == ^._key][0].description, $locale == "it" => ^.i18n.it.capabilities[@._key == ^._key][0].description, $locale == "fr" => ^.i18n.fr.capabilities[@._key == ^._key][0].description), description)
    },
    "processHeading": coalesce(select($locale == "sq" => i18n.sq.processHeading, $locale == "it" => i18n.it.processHeading, $locale == "fr" => i18n.fr.processHeading), processHeading),
    "processSteps": processSteps[]{
      ...,
      "title": coalesce(select($locale == "sq" => ^.i18n.sq.processSteps[@._key == ^._key][0].title, $locale == "it" => ^.i18n.it.processSteps[@._key == ^._key][0].title, $locale == "fr" => ^.i18n.fr.processSteps[@._key == ^._key][0].title), title),
      "description": coalesce(select($locale == "sq" => ^.i18n.sq.processSteps[@._key == ^._key][0].description, $locale == "it" => ^.i18n.it.processSteps[@._key == ^._key][0].description, $locale == "fr" => ^.i18n.fr.processSteps[@._key == ^._key][0].description), description)
    },
    "whyUsHeading": coalesce(select($locale == "sq" => i18n.sq.whyUsHeading, $locale == "it" => i18n.it.whyUsHeading, $locale == "fr" => i18n.fr.whyUsHeading), whyUsHeading),
    "whyUsItems": whyUsItems[]{
      ...,
      "title": coalesce(select($locale == "sq" => ^.i18n.sq.whyUsItems[@._key == ^._key][0].title, $locale == "it" => ^.i18n.it.whyUsItems[@._key == ^._key][0].title, $locale == "fr" => ^.i18n.fr.whyUsItems[@._key == ^._key][0].title), title),
      "description": coalesce(select($locale == "sq" => ^.i18n.sq.whyUsItems[@._key == ^._key][0].description, $locale == "it" => ^.i18n.it.whyUsItems[@._key == ^._key][0].description, $locale == "fr" => ^.i18n.fr.whyUsItems[@._key == ^._key][0].description), description)
    },
    "otherServices": otherServices[]{
      ...,
      "title": coalesce(select($locale == "sq" => ^.i18n.sq.otherServices[@._key == ^._key][0].title, $locale == "it" => ^.i18n.it.otherServices[@._key == ^._key][0].title, $locale == "fr" => ^.i18n.fr.otherServices[@._key == ^._key][0].title), title),
      "description": coalesce(select($locale == "sq" => ^.i18n.sq.otherServices[@._key == ^._key][0].description, $locale == "it" => ^.i18n.it.otherServices[@._key == ^._key][0].description, $locale == "fr" => ^.i18n.fr.otherServices[@._key == ^._key][0].description), description)
    },
    ctaSection,
    "faqs": faqs[]{
      ...,
      "question": coalesce(select($locale == "sq" => ^.i18n.sq.faqs[@._key == ^._key][0].question, $locale == "it" => ^.i18n.it.faqs[@._key == ^._key][0].question, $locale == "fr" => ^.i18n.fr.faqs[@._key == ^._key][0].question), question),
      "answer": coalesce(select($locale == "sq" => ^.i18n.sq.faqs[@._key == ^._key][0].answer, $locale == "it" => ^.i18n.it.faqs[@._key == ^._key][0].answer, $locale == "fr" => ^.i18n.fr.faqs[@._key == ^._key][0].answer), answer)
    }
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
    "name": coalesce(select($locale == "sq" => i18n.sq.name, $locale == "it" => i18n.it.name, $locale == "fr" => i18n.fr.name), name),
    slug,
    "tagline": coalesce(select($locale == "sq" => i18n.sq.tagline, $locale == "it" => i18n.it.tagline, $locale == "fr" => i18n.fr.tagline), tagline),
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
    "role": coalesce(select($locale == "sq" => i18n.sq.role, $locale == "it" => i18n.it.role, $locale == "fr" => i18n.fr.role), role),
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
    "title": coalesce(select($locale == "sq" => i18n.sq.title, $locale == "it" => i18n.it.title, $locale == "fr" => i18n.fr.title), title),
    slug,
    "excerpt": coalesce(select($locale == "sq" => i18n.sq.excerpt, $locale == "it" => i18n.it.excerpt, $locale == "fr" => i18n.fr.excerpt), excerpt),
    category,
    coverImage,
    publishedAt
  }`
)

export const allDiaryPostsQuery = defineQuery(
  `*[_type == "diaryPost"] | order(orderRank) {
    _id,
    _updatedAt,
    "title": coalesce(select($locale == "sq" => i18n.sq.title, $locale == "it" => i18n.it.title, $locale == "fr" => i18n.fr.title), title),
    slug,
    "excerpt": coalesce(select($locale == "sq" => i18n.sq.excerpt, $locale == "it" => i18n.it.excerpt, $locale == "fr" => i18n.fr.excerpt), excerpt),
    category,
    coverImage,
    publishedAt
  }`
)

export const diaryPostBySlugQuery = defineQuery(
  `*[_type == "diaryPost" && slug.current == $slug][0] {
    _id,
    "title": coalesce(select($locale == "sq" => i18n.sq.title, $locale == "it" => i18n.it.title, $locale == "fr" => i18n.fr.title), title),
    slug,
    "excerpt": coalesce(select($locale == "sq" => i18n.sq.excerpt, $locale == "it" => i18n.it.excerpt, $locale == "fr" => i18n.fr.excerpt), excerpt),
    category,
    coverImage,
    "body": coalesce(select($locale == "sq" => i18n.sq.body, $locale == "it" => i18n.it.body, $locale == "fr" => i18n.fr.body), body),
    publishedAt
  }`
)

// Related diary posts — same category first (newest), then a recent-posts
// fallback to fill remaining slots (combined in the page).
export const relatedDiaryPostsQuery = defineQuery(
  `*[_type == "diaryPost" && slug.current != $slug && category == $category] | order(publishedAt desc) [0...5] {
    _id, "title": coalesce(select($locale == "sq" => i18n.sq.title, $locale == "it" => i18n.it.title, $locale == "fr" => i18n.fr.title), title), slug, "excerpt": coalesce(select($locale == "sq" => i18n.sq.excerpt, $locale == "it" => i18n.it.excerpt, $locale == "fr" => i18n.fr.excerpt), excerpt), category, coverImage, publishedAt
  }`
)

export const moreDiaryPostsQuery = defineQuery(
  `*[_type == "diaryPost" && slug.current != $slug] | order(publishedAt desc) [0...8] {
    _id, "title": coalesce(select($locale == "sq" => i18n.sq.title, $locale == "it" => i18n.it.title, $locale == "fr" => i18n.fr.title), title), slug, "excerpt": coalesce(select($locale == "sq" => i18n.sq.excerpt, $locale == "it" => i18n.it.excerpt, $locale == "fr" => i18n.fr.excerpt), excerpt), category, coverImage, publishedAt
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
    "name": coalesce(select($locale == "sq" => i18n.sq.name, $locale == "it" => i18n.it.name, $locale == "fr" => i18n.fr.name), name),
    slug,
    "tagline": coalesce(select($locale == "sq" => i18n.sq.tagline, $locale == "it" => i18n.it.tagline, $locale == "fr" => i18n.fr.tagline), tagline),
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
    "name": coalesce(select($locale == "sq" => i18n.sq.name, $locale == "it" => i18n.it.name, $locale == "fr" => i18n.fr.name), name),
    slug,
    "tagline": coalesce(select($locale == "sq" => i18n.sq.tagline, $locale == "it" => i18n.it.tagline, $locale == "fr" => i18n.fr.tagline), tagline),
    client,
    industry,
    services,
    thumbnail,
    thumbnailType,
    thumbnailVideo
  }`
)
