'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStartProject } from '@/components/start-project/StartProjectProvider'

/* The "Start a Project" experience is now a global slide-in chat panel rather
   than a standalone page. If someone lands on the old URL directly, open the
   panel and send them to the home page underneath it. */
// Client component — no setRequestLocale here (it is server-only), and none is
// needed: a client page prerenders to static HTML regardless.
export default function StartProjectPage() {
  const router = useRouter()
  const { open } = useStartProject()

  useEffect(() => {
    open()
    router.replace('/')
  }, [open, router])

  /* The layout renders <Footer /> as a permanent sibling of the page. While this
     redirect page is mounted the <main> is empty, so the footer would sit right
     under the header — visible through the lightly-dimmed chat backdrop — until
     router.replace('/') streams the home content in and pushes it down (the
     "footer first, then jumps up to the hero" flash). A full-screen cover in the
     site background colour hides the empty main + footer until '/' takes over.
     z-[1000] keeps it below the chat backdrop (z-1900) and panel (z-2000). */
  return <div aria-hidden className="fixed inset-0 z-[1000] bg-bg" />
}
