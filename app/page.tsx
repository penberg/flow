'use client'

import dynamic from 'next/dynamic'

const IssuesPage = dynamic(() => import("@/components/issues-page").then((mod) => ({ default: mod.IssuesPage })), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
})

export default function HomePage() {
  return <IssuesPage />
}
