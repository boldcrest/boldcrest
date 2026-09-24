import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // MUST stay false: every public route is statically generated (see the SSG
  // notes in the i18n setup) and revalidated with ISR, so a build reads its
  // content once and bakes it into the HTML. Reading through Sanity's CDN
  // meant a build could bake in a stale copy of a document that had already
  // been updated — three diary posts shipped with pre-review Albanian titles
  // that way on 2026-09-22 while the API and CDN both already served the new
  // ones. Hitting the API directly costs a little build time and makes the
  // output deterministic.
  useCdn: false,
})

// How long a Sanity response may sit in Next's fetch Data Cache.
//
// Without this every `client.fetch` is cached indefinitely: Vercel restores
// `.next/cache` between builds, so a later build re-serves a response from an
// earlier one and a pure CMS edit never reaches the site. That is not
// hypothetical — it shipped three diary posts with pre-review Albanian titles
// (2026-09-22), and again held back 20 repaired Italian project fields until
// this was added. `useCdn: false` alone only appeared to fix it, because
// flipping it changed every fetch URL and so invalidated the old cache keys.
//
// 300s matches the ISR stale time the pages are already served with, so an
// edit in Studio shows up within roughly the same window.
export const CMS_REVALIDATE = 300
