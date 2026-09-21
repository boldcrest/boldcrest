/* ════════════════════════════════════════════════════
   Megi's contextual replies (Start a New Project chat)

   SINGLE SOURCE OF TRUTH for the bot's answer to each selection. To change
   what Megi says, edit the copy below — nothing else needs touching.

   How it renders: each reply is ONE bubble, shaped as `${opener}, ${clause}`
   (one sentence, friendly + a touch playful, no emoji, no em dash). The opener
   is picked deterministically from the chosen value, so the same answer always
   reads the same (stable across re-renders / the reveal animation) while
   different answers vary the opener across the conversation.

   Keys MUST match the option strings in StartProjectChat.tsx exactly.
══════════════════════════════════════════════════════ */

export type ReplyStep = 'services' | 'kickoff' | 'deadline' | 'budget' | 'source'

// 5 alternative acknowledgement openers. No trailing punctuation — a comma +
// the clause is appended.
const OPENERS = ['perfect', 'loveThat', 'great', 'gotIt', 'nice'] as const

// Per-option clause. Reads as the second half of `${opener}, ${clause}`, so
// keep each one lowercase, short, and able to follow a comma naturally.
const CLAUSES: Record<ReplyStep, Record<string, string>> = {
  services: {
    'Branding': 'anIdentityPeopleActuallyRememberIs',
    'Packaging design': 'shelfPresenceIsWhereWeHaveTheMostF',
    'Photography': 'weWillMakeSureItLooksEveryBitThePa',
    'Videography': 'motionIsOneOfOurFavouriteWaysToTel',
    'TV commercials': 'bigScreenBiggerIdeasCountUsIn',
    'Social media': 'weWillKeepYourFeedWorthTheFollow',
    'Website': 'aSiteThatWorksAsHardAsItLooksDone',
    'Other': 'tellUsALittleMoreAndWeWillShapeItT',
  },
  kickoff: {
    'ASAP, within the next two weeks.': 'weLikeMomentumJustAsMuchAsYouDo',
    'Soon, next month would be great.': 'thatGivesUsRoomToStartItRight',
    'Within the next 3 months.': 'aHealthyRunwayToDoThisProperly',
    'No rush. Whenever fits your team.': 'goodWorkRarelyLikesBeingRushed',
  },
  deadline: {
    'Within 3 months.': 'tightButVeryDoableWeLikeThePace',
    'Within 6 months.': 'plentyOfSpaceToGetItRight',
    'In about a year.': 'roomToBeProperlyAmbitious',
    'Open-ended, quality over speed.': 'ourFavouriteKindOfBrief',
  },
  budget: {
    'Under €5,000': 'weWillMakeEveryEuroPullItsWeight',
    '€5,000 – €15,000': 'aSolidBaseToBuildSomethingSharp',
    '€15,000 – €50,000': 'nowWeHaveRoomToGetAmbitious',
    '€50,000+': 'thisIsWhereWeDoOurBestWork',
    "Not sure yet, let's figure it out.": 'noProblemWeWillShapeItAroundTheWor',
  },
  source: {
    'A client referral': 'alwaysTheBestKindOfIntroduction',
    'A friend or colleague': 'goodPeopleTalkAndWeAppreciateIt',
    'Google': 'gladTheSearchSentYouOurWay',
    'Social media': 'gladTheFeedDidItsJob',
    "I've been following BoldCrest for a while": 'thatGenuinelyMeansALot',
    'Somewhere else': 'howeverYouFoundUsWeAreGladYouDid',
  },
}

// Deterministic opener pick: same seed -> same opener (stable across renders),
// different seeds spread across the pool.
function pickOpener(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return OPENERS[h % OPENERS.length]
}

/**
 * Megi's one-sentence contextual reply for a given selection. For multi-select
 * steps (services, source) pass the representative value (e.g. the first
 * picked). Falls back gracefully so an unmapped/empty value never breaks the
 * flow.
 */
export function botReply(
  step: ReplyStep,
  value: string | undefined,
  t: (key: string) => string,
): string {
  const clauseKey = (value && CLAUSES[step]?.[value]) || 'soundsGoodLetUsKeepGoing'
  return `${t(pickOpener(value || step))}, ${t(clauseKey)}`
}

/* ════════════════════════════════════════════════════
   Greeting / hand-off / sign-off variants

   Unlike the contextual replies above (which answer a SELECTION), these are the
   fixed conversational beats — the opening wave, the visitor waving back, Megi's
   welcome after the intro, and the sign-off. Each gets a small pool of
   interchangeable phrasings; one is picked at random ONCE per conversation (via
   a stable seed held in StartProjectChat) so every visit reads a little
   differently while staying put across the reveal animation and re-renders.

   Emojis and {name} are intentional here (this is the human, hello/goodbye part
   of the chat — the no-emoji rule only applies to the contextual replies above).
   {name} is replaced with the visitor's first name, with a friendly fallback.
   To add or reword a line, just edit a pool below — nothing else changes.
══════════════════════════════════════════════════════ */

export const GREETINGS = {
  // Megi's opening wave (paired with a fixed "I'm Megi." line).
  agencyHello: ['hiThere', 'heyThere', 'hello', 'hi', 'hey'],
  // The visitor waving back (paired with a fixed 👋 bubble).
  userHello: [
    'niceToMeetYouMegi',
    'heyMegiGreatToMeetYou',
    'lovelyToMeetYouMegi',
    'goodToMeetYouMegi',
    'pleasureToMeetYouMegi',
  ],
  // Megi's welcome right after the visitor shares name / role / company.
  agencyWelcome: [
    'thePleasureIsMineName',
    'greatToHaveYouHereName',
    'wonderfulToMeetYouName',
    'lovelyToHaveYouName',
    'brilliantThanksName',
  ],
  // ...followed by the actual ask.
  agencyAsk: [
    'howCanWeHelp',
    'soHowCanWeHelp',
    'whatCanWeDoForYou',
    'whereCanWeJumpIn',
  ],
  // Megi's sign-off on the sent screen.
  agencyBye: [
    'talkSoonName',
    'speakSoonName',
    'chatSoonName',
    'catchYouSoonName',
    'untilNextTimeName',
  ],
} as const

export type GreetingSlot = keyof typeof GREETINGS

// Hash the slot name into the seed so different slots pick independently (a
// shared seed alone would correlate them), while the same (slot, seed) pair
// always resolves to the same line — stable across the reveal animation.
function pickVariant(pool: readonly string[], seed: number, slot: string): string {
  let h = seed >>> 0
  for (let i = 0; i < slot.length; i++) h = (h * 31 + slot.charCodeAt(i)) >>> 0
  return pool[h % pool.length]
}

/**
 * One stable-but-random greeting/sign-off line for the given slot. Pass the
 * per-conversation seed (see StartProjectChat) and the visitor's name; {name}
 * is filled with their first word, or a friendly fallback if unknown.
 */
export function greeting(
  slot: GreetingSlot,
  seed: number,
  t: (key: string) => string,
  name?: string,
): string {
  const first = (name || '').trim().split(/\s+/)[0]
  return t(pickVariant(GREETINGS[slot], seed, slot)).replace('{name}', first || 'there')
}
