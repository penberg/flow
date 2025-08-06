'use client'

import { createIssue, updateIssue, deleteIssue } from '@/lib/db'
import { useIssues } from '@/hooks/use-issues'
import { IssueCard } from '@/components/issue-card'
import { CreateIssueDialog } from '@/components/create-issue-dialog'
import { Badge } from '@/components/ui/badge'
import type { CreateIssueData, UpdateIssueData } from '@/lib/types'
import { useCallback } from 'react'

export function IssuesPage() {
  const { isLoading, error, allIssues, todoIssues, inProgressIssues, doneIssues, openIssuesCount } = useIssues()

  const handleCreateIssue = useCallback(async (data: CreateIssueData) => {
    await createIssue({
      id: crypto.randomUUID(),
      issue_number: 0, // Will be set by server
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  }, [])

  const handleUpdateIssue = useCallback(async (id: string, updates: UpdateIssueData) => {
    await updateIssue(id, updates)
  }, [])

  const handleDeleteIssue = useCallback(async (id: string) => {
    await deleteIssue(id)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Flow</h1>
              <Badge variant="secondary" className="text-xs">
                {openIssuesCount} open issues
              </Badge>
            </div>
            <CreateIssueDialog onCreateIssue={handleCreateIssue} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {allIssues.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first issue.</p>
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
                  <IssueCard key={issue.id} issue={issue} onUpdate={handleUpdateIssue} onDelete={handleDeleteIssue} />
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
                  <IssueCard key={issue.id} issue={issue} onUpdate={handleUpdateIssue} onDelete={handleDeleteIssue} />
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
                  <IssueCard key={issue.id} issue={issue} onUpdate={handleUpdateIssue} onDelete={handleDeleteIssue} />
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