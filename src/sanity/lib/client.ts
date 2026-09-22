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
