"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h1>
        <p className="mb-6 text-sm text-gray-600">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Try again
        </button>
      </div>
    </div>
  )
}
