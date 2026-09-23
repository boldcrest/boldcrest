/* Draft preview only. Renders the case-study template with stand-in content so
   the design can be reviewed before any caseStudy document exists in Sanity.
   The client, the figures and the imagery are invented. */
import type { Metadata } from 'next'
import CaseStudyArticle, {
  type CaseStudy,
} from '../case-studies/[slug]/CaseStudyArticle'

// Kept out of the index: this is a fictional client with invented numbers, and
// the route inherits `index, follow` from the root layout otherwise. Without
// this it would be crawlable the moment the branch ships.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}


// A real 9:16 reel (720x1280, 52s), four times over so the feed can be walked
// first / middle / last on a true reel. Served as a file from /public/reels —
// which is gitignored: it is patient footage and the repo is public. On a
// deploy this would be a Vimeo address like everything else.
const JOKADENT_REEL = '/reels/jokadent-reel.mp4'
const REELS = [JOKADENT_REEL, JOKADENT_REEL, JOKADENT_REEL, JOKADENT_REEL]

const FEED_REFS = [
  'image-06326fe2d03e0b8cb17f06bf38717214f99d58d7-2918x2917-png',
  'image-03f2fbacb39bb84ebc05fcf928135946474c3a76-2000x2000-jpg',
  'image-0f3b106929eda4af3ed5829966873d84e242a382-1920x1920-jpg',
  'image-57e45a4ea75e0c0a4ddc04b29fcdbc763988bd78-1920x1920-jpg',
  'image-e6dd3824e2495c438535b8f8b5de83eab84e2a32-1920x1920-jpg',
  'image-00759f49a1e6351193fe712b662463789b7f5a4c-1920x1920-png',
  'image-693974c610c134a317857776523521243787bd69-3125x2500-png',
  'image-deee406c5e33f10cc2060e1c64328e76896a8c9a-3125x2500-png',
  'image-3f427bc52a4366d8fa97b4ea10cb53ade5565120-3000x2347-jpg',
]

function block(text: string) {
  return {
    _type: 'block',
    style: 'normal',
    children: [{ _type: 'span', text }],
  }
}

const STUDY: CaseStudy = {
  _id: 'mock',
  title: 'A bakery that stopped selling bread and started selling mornings',
  slug: { current: 'mock' },
  client: 'Buka Ime',
  kpi: {
    value: '+312%',
    label: 'Organic reach in 90 days',
    context:
      'From 41,000 to 168,000 accounts reached per month, with no paid support behind the organic feed.',
  },
  stats: [
    { value: '18.4%', label: 'Engagement rate' },
    { value: '2.1M', label: 'Video views' },
    { value: '+47%', label: 'Footfall, weekends' },
  ],
  explanation: [
    block(
      'Buka Ime had the best sourdough in Tirana and a feed that looked like every other bakery: flat-lay loaves, price tags, the occasional oven shot. The product was not the problem. The framing was.',
    ),
    block(
      'We stopped photographing bread and started photographing the twenty minutes around it — the queue at 7:40, steam on the window, the second coffee nobody planned to order. The loaf became the reason those mornings existed rather than the subject of the post.',
    ),
    block(
      'Six reels carried the campaign, cut from a single shooting day and released weekly. The feed was built to be read three-at-a-time, so each row landed as one idea instead of nine unrelated squares.',
    ),
  ],
  reels: REELS.map((vimeoUrl, i) => ({
    vimeoUrl,
    aspectRatio: '9:16',
    poster: '/reels/jokadent-reel.jpg',
    caption: ['Marian, Lombardia', 'Second', 'Third', 'Fourth'][i],
  })),
  feed: FEED_REFS.map((ref, i) => ({
    _key: String(i),
    alt: '',
    asset: { _ref: ref },
  })),
}

export default function MockCaseStudyPage() {
  return (
    <CaseStudyArticle
      study={STUDY}
      labels={{
        eyebrow: 'Case Study',
        reels: 'Reels',
        reelsHint: 'Drag / tap to play',
        close: 'Close',
        feed: 'The Feed',
      }}
    />
  )
}
