import { getIssues } from "@/lib/actions"
import { IssueCard } from "@/components/issue-card"
import { CreateIssueDialog } from "@/components/create-issue-dialog"
import { Badge } from "@/components/ui/badge"
import { use } from "react"

// Create (and cache) the promise outside the component
const issuesPromise = getIssues()

export default function HomePage() {
  const issues = use(issuesPromise) // ← no try/catch

  const todoIssues = issues.filter((issue) => issue.status === "todo")
  const inProgressIssues = issues.filter((issue) => issue.status === "in_progress")
  const doneIssues = issues.filter((issue) => issue.status === "done")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Flow</h1>
              <Badge variant="secondary" className="text-xs">
                {issues.length} issues
              </Badge>
              {process.env.VERCEL_ENV && (
                <Badge variant="outline" className="text-xs">
                  {process.env.VERCEL_ENV}
                </Badge>
              )}
            </div>
            <CreateIssueDialog />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {issues.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-500 mb-4">This could mean the database is empty or there's a connection issue.</p>
            <p className="text-sm text-gray-400">Check the browser console for connection details.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Todo Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">Todo</h2>
                <Badge variant="secondary" className="text-xs">
                  {todoIssues.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {todoIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
                {todoIssues.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">No todo issues</div>
                )}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">In Progress</h2>
                <Badge variant="secondary" className="text-xs">
                  {inProgressIssues.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {inProgressIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
                {inProgressIssues.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">No issues in progress</div>
                )}
              </div>
            </div>

            {/* Done Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-900">Done</h2>
                <Badge variant="secondary" className="text-xs">
                  {doneIssues.length}
                </Badge>
              </div>
              <div className="space-y-3">
                {doneIssues.map((issue) => (
                  <IssueCard key={issue.id} issue={issue} />
                ))}
                {doneIssues.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">No completed issues</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
