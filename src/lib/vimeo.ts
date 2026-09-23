/**
 * Server-side helper to read a Vimeo video's native aspect ratio from its public
 * oEmbed endpoint, so portfolio videos render at their true shape (square,
 * portrait, 16:9, …) instead of being forced into — and cropped by — a fixed
 * 16:9 box. Fetched on the server (no CORS) and cached for a week. Returns null
 * on any failure so callers fall back to 16:9.
 */
export function extractVimeoId(url: string): string | null {
  return extractVimeoRef(url).id
}

/**
 * The id AND the privacy hash, because for an unlisted video the hash is part
 * of the address: without it the player refuses to play and oEmbed 404s. Our
 * reels are uploaded "Hide from Vimeo" with embedding public, which is exactly
 * that case. Handles every shape the URL arrives in:
 *   https://vimeo.com/123456789
 *   https://vimeo.com/123456789/abcdef1234      (unlisted share link)
 *   https://player.vimeo.com/video/123456789?h=abcdef1234
 */
export function extractVimeoRef(url?: string | null): {
  id: string | null
  hash: string | null
} {
  if (!url) return { id: null, hash: null }
  const id = url.match(/(?:vimeo\.com\/(?:video\/)?)(\d+)/)?.[1] ?? null
  const hash =
    url.match(/[?&]h=([0-9a-zA-Z]+)/)?.[1] ??
    url.match(/vimeo\.com\/(?:video\/)?\d+\/([0-9a-zA-Z]+)/)?.[1] ??
    null
  return { id, hash }
}

/**
 * Parse a manual aspect-ratio override (e.g. "16:9") into a width/height number.
 * Returns null for "auto"/empty/invalid so callers fall back to the Vimeo aspect.
 */
export function parseAspectRatio(value?: string | null): number | null {
  if (!value || value === 'auto' || value === 'custom') return null
  const v = value.trim()
  const ratio = v.match(/^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/)
  if (ratio) {
    const w = Number(ratio[1])
    const h = Number(ratio[2])
    return w > 0 && h > 0 ? w / h : null
  }
  // Also accept a single number (e.g. "2.35" → 2.35:1).
  const num = Number(v)
  return Number.isFinite(num) && num > 0 ? num : null
}

export async function getVimeoAspect(url?: string | null): Promise<number | null> {
  return (await getVimeoMeta(url)).aspect
}

/**
 * Like getVimeoAspect but also returns the video's cover image (Vimeo's oEmbed
 * `thumbnail_url` — the custom cover if one is set, otherwise an auto frame).
 * Used for the side-nav rail thumbnail and the poster-until-play overlay (which
 * stays visible when iOS low-power blocks autoplay). One oEmbed call, cached 1wk.
 */
export async function getVimeoMeta(
  url?: string | null,
): Promise<{ aspect: number | null; poster: string | null }> {
  if (!url) return { aspect: null, poster: null }
  const { id, hash } = extractVimeoRef(url)
  if (!id) return { aspect: null, poster: null }
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
        `https://vimeo.com/${id}${hash ? `/${hash}` : ''}`,
      )}&width=1280`,
      { next: { revalidate: 604800 } }, // 1 week
    )
    if (!res.ok) return { aspect: null, poster: null }
    const data = (await res.json()) as {
      width?: number
      height?: number
      thumbnail_url?: string
    }
    const w = Number(data.width)
    const h = Number(data.height)
    const aspect = w > 0 && h > 0 ? w / h : null
    return { aspect, poster: data.thumbnail_url || null }
  } catch {
    return { aspect: null, poster: null }
  }
}
