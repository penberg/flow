"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("💥 Page error:", error)
  }, [error])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h1>
      <p className="mb-6 max-w-md text-center text-sm text-red-500 whitespace-pre-wrap">{error.message}</p>
      <Button onClick={() => reset()}>Try again</Button>
    </main>
  )
}
