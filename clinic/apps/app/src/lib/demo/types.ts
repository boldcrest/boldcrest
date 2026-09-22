// The domain types used to live here. They moved to @clinic/core (pure
// domain logic, no React/DOM/localStorage) so packages/core's protocols.ts
// and whatsapp.ts do not have to import from this app. This re-export is
// kept so the many files in this app that still write
// `import type {...} from "@/lib/demo/types"` (or "./types" / "../demo/types")
// did not all need to change in the same pass as the workspace split.
export * from "@clinic/core";
