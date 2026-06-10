/**
 * Renders a JSON-LD structured-data block. Pass any schema.org object built
 * via the helpers in `@/lib/seo`.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
