import { defineQuery } from 'next-sanity'

// Homepage "Selected Works" — the latest projects (newest year first, then most
// recently added), excluding any explicitly hidden with featured == false.
export const featuredProjectsQuery = defineQuery(
  `*[_type == "project" && featured != false] | order(year desc, _createdAt desc) [0...6] {
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
  `*[_type == "project"] | order(year desc, order asc) {
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
        vimeoUrl
      },
      _type == "image" => {
        "type": "image",
        asset,
        hotspot,
        crop
      },
      _type == "imageMedia" => {
        "type": "image",
        "asset": coalesce(asset, image.asset),
        "hotspot": coalesce(hotspot, image.hotspot),
        "crop": coalesce(crop, image.crop)
      }
    }
  }`
)

export const nextProjectQuery = defineQuery(
  `*[_type == "project" && order > $currentOrder] | order(order asc) [0] {
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

export const allPartnersQuery = defineQuery(
  `*[_type == "partner"] | order(order asc) {
    _id,
    name,
    logo,
    website,
    showOn
  }`
)

export const homepagePartnersQuery = defineQuery(
  `*[_type == "partner" && "homepage" in showOn] | order(order asc) {
    _id,
    name,
    logo,
    website
  }`
)

export const servicesPartnersQuery = defineQuery(
  `*[_type == "partner" && "services" in showOn] | order(order asc) {
    _id,
    name,
    logo,
    website
  }`
)

// Projects filtered by service names (for subpages)
export const projectsByServicesQuery = defineQuery(
  `*[_type == "project" && count((services[])[@ in $serviceNames]) > 0] | order(order asc) [0...6] {
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
  `*[_type == "teamMember"] | order(order asc) {
    _id,
    name,
    role,
    image
  }`
)

export const latestDiaryPostsQuery = defineQuery(
  `*[_type == "diaryPost"] | order(publishedAt desc) [0...4] {
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
  `*[_type == "diaryPost"] | order(publishedAt desc) {
    _id,
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
