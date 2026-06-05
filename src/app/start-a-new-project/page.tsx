'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStartProject } from '@/components/start-project/StartProjectProvider'

/* The "Start a Project" experience is now a global slide-in chat panel rather
   than a standalone page. If someone lands on the old URL directly, open the
   panel and send them to the home page underneath it. */
export default function StartProjectPage() {
  const router = useRouter()
  const { open } = useStartProject()

  useEffect(() => {
    open()
    router.replace('/')
  }, [open, router])

  return null
}
