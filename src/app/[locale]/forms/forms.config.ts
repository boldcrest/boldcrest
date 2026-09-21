/**
 * Embedded ClickUp forms.
 *
 * Each entry is reachable at /forms/<slug> and is served on its matching vanity
 * subdomain (branding.boldcrest.com, etc.) via a REWRITE in `src/proxy.ts` — so
 * the form shows inside the BoldCrest site (header/footer) instead of redirecting
 * to the bare ClickUp page. Add a form here + a mapping in proxy.ts to wire a new
 * subdomain. (careers lives at its own /careers route and isn't listed here.)
 *
 * Titles/descriptions are best-guess labels for the browser tab/OG — adjust freely.
 */
export interface EmbeddedForm {
  url: string
  title: string
  description: string
}

export const EMBEDDED_FORMS: Record<string, EmbeddedForm> = {
  branding: {
    url: 'https://forms.clickup.com/765766/f/qbu6-40361/90O1PL1P7J6U3HO2RS',
    title: 'Branding Brief',
    description: 'Start a branding project with BoldCrest.',
  },
  timeoff: {
    url: 'https://forms.clickup.com/765766/f/qbu6-78355/ZRZLB67MPJBR7YCSBJ',
    title: 'Time Off Request',
    description: 'Submit a time off request.',
  },
  employee: {
    url: 'https://forms.clickup.com/765766/f/qbu6-74875/D08J11PMYODUN5U4AH',
    title: 'Employee Form',
    description: 'BoldCrest employee form.',
  },
  client: {
    url: 'https://forms.clickup.com/765766/f/qbu6-72315/V2M4G4AELYAJ143MQT',
    title: 'Client Brief',
    description: 'Tell us about your project.',
  },
}
