#!/usr/bin/env node
// Warm the Sanity image CDN for every portfolio slide at each srcset width the
// site can request, so the first visitor never waits for an on-demand transform
// (a cold 4000px source takes 1–4 s per size — that's the "left half loads, right
// half lags" symptom on freshly uploaded slides).
//
//   node scripts/warm-sanity-images.mjs            # every project image
//   node scripts/warm-sanity-images.mjs <slug> …   # only these projects
//   node scripts/warm-sanity-images.mjs --asset image-<hash>-4000x5332-jpg …
//
// Run it right after adding or replacing slides. Idempotent; read-only.

const PROJECT = 'de0anuhy'
const DATASET = 'boldcrest'
const WIDTHS = [640, 750, 828, 1080, 1200, 1920, 2048, 3840] // next/image deviceSizes
const QUALITY = 85 // matches ContentStack's urlFor(...).quality(85)
const CONCURRENCY = 12

const args = process.argv.slice(2)
let urls = []

if (args[0] === '--asset') {
  urls = args.slice(1).map((ref) => {
    const id = ref.replace(/^image-/, '').replace(/-([a-z0-9]+)$/, '.$1')
    return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${id}`
  })
} else {
  const filter = args.length ? ` && slug.current in ${JSON.stringify(args)}` : ''
  const query = `*[_type=="project"${filter}].media[_type in ["imageMedia","image"]].image.asset->url`
  const res = await fetch(
    `https://${PROJECT}.apicdn.sanity.io/v2026-02-27/data/query/${DATASET}?query=${encodeURIComponent(query)}`,
  )
  urls = (await res.json()).result.filter(Boolean)
}

const jobs = urls.flatMap((u) => WIDTHS.map((w) => `${u}?w=${w}&q=${QUALITY}&auto=format`))
console.log(`${urls.length} images × ${WIDTHS.length} widths = ${jobs.length} requests`)

const counts = {}
let slow = 0
let i = 0
async function worker() {
  while (i < jobs.length) {
    const url = jobs[i++]
    const t = Date.now()
    try {
      const r = await fetch(url, { headers: { Accept: 'image/avif,image/webp,*/*' } })
      await r.arrayBuffer()
      counts[r.status] = (counts[r.status] || 0) + 1
      if (Date.now() - t > 2000) slow++
    } catch (e) {
      counts.error = (counts.error || 0) + 1
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))
console.log('status counts:', counts, `| ${slow} responses over 2 s (cold transforms)`)
