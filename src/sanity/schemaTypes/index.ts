import { type SchemaTypeDefinition } from 'sanity'

import { project } from './project'
import { service } from './service'
import { teamMember } from './teamMember'
import { partner } from './partner'
import { siteSettings } from './siteSettings'
import { diaryPost } from './diaryPost'
import { caseStudy } from './caseStudy'
import { servicesPage } from './servicesPage'
import { serviceDetailPage } from './serviceDetailPage'
import { yearPhoto } from './yearPhoto'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    project,
    service,
    teamMember,
    partner,
    siteSettings,
    diaryPost,
    caseStudy,
    servicesPage,
    serviceDetailPage,
    yearPhoto,
  ],
}
