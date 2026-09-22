import type { StructureResolver } from 'sanity/structure'
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list'
import { OrderableListWithStatusFilter } from './components/OrderableListWithStatusFilter'

// These types are drag-and-drop orderable in the Studio list (their site order
// follows the list order via `orderRank`).
const ORDERABLE = ['project', 'teamMember', 'partner', 'diaryPost', 'caseStudy', 'yearPhoto']

// Types handled explicitly below, so they don't also appear in the catch-all.
const HANDLED = [
  'siteSettings',
  ...ORDERABLE,
  'service',
  'servicesPage',
  'serviceDetailPage',
]

export const structure: StructureResolver = (S, context) => {
  // Project + Diary: drag-orderable list with a Published / Drafts / Both filter
  // bar on top (defaults to Both, keeps drag-reorder). People + Partner use the
  // plain orderable list (no publish-status UI).
  const filterableList = (type: string, title: string) =>
    S.listItem()
      .title(title)
      .id(type)
      .child(
        S.component(OrderableListWithStatusFilter)
          .id(type)
          .title(title)
          .options({ type })
          .menuItems([
            S.menuItem().title('Create new').intent({ type: 'create', params: { type } }),
          ])
          .child((id: string) =>
            S.document()
              .schemaType(type)
              .documentId(String(id).replace(/^drafts\./, '')),
          ),
      )

  return S.list()
    .title('Content')
    .items([
      filterableList('project', 'Project'),
      filterableList('diaryPost', 'Diary Post'),
      filterableList('caseStudy', 'Case Study'),
      // People → Team Members + Year Photo (yearly group photos for the /people strip)
      S.listItem()
        .title('People')
        .id('peopleGroup')
        .child(
          S.list()
            .title('People')
            .items([
              orderableDocumentListDeskItem({
                type: 'teamMember',
                title: 'Team Members',
                S,
                context,
              }),
              orderableDocumentListDeskItem({
                type: 'yearPhoto',
                title: 'Year Photo',
                S,
                context,
              }),
            ]),
        ),
      orderableDocumentListDeskItem({ type: 'partner', title: 'Partner', S, context }),
      S.divider(),
      // Services: page content (editable copy) + the offerings list.
      S.listItem()
        .title('Services')
        .id('servicesGroup')
        .child(
          S.list()
            .title('Services')
            .items([
              S.listItem()
                .title('Services Page (main)')
                .id('servicesPage')
                .child(S.document().schemaType('servicesPage').documentId('servicesPage')),
              S.divider(),
              S.listItem()
                .title('Brand Development')
                .id('sdpBrand')
                .child(
                  S.document()
                    .schemaType('serviceDetailPage')
                    .documentId('serviceDetailPage-brand-development'),
                ),
              S.listItem()
                .title('Still & Motion')
                .id('sdpStill')
                .child(
                  S.document()
                    .schemaType('serviceDetailPage')
                    .documentId('serviceDetailPage-still-motion'),
                ),
              S.listItem()
                .title('Communication')
                .id('sdpComms')
                .child(
                  S.document()
                    .schemaType('serviceDetailPage')
                    .documentId('serviceDetailPage-communication'),
                ),
            ]),
        ),
      S.divider(),
      // Anything not handled above keeps the default list.
      ...S.documentTypeListItems().filter(
        (listItem) => !HANDLED.includes(listItem.getId() as string),
      ),
    ])
}
