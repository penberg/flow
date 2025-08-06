'use client'

import dynamic from 'next/dynamic'

const IssuesPage = dynamic(() => import("@/components/issues-page").then((mod) => ({ default: mod.IssuesPage })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  )
})

export default function HomePage() {
  return <IssuesPage />
}
