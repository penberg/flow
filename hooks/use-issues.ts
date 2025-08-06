'use client'

import { useLiveQuery } from '@tanstack/react-db'
import { issuesCollection } from '@/lib/db'
import { useEffect, useMemo } from 'react'
import type { Issue } from '@/lib/types'

export function useIssues() {
  useEffect(() => {
    issuesCollection.preload()
  }, [])

  const { data: allIssues = [], isLoading, isReady, error } = useLiveQuery((q) =>
    q.from({ issues: issuesCollection })
  )

  const todoIssues = useMemo(() => 
    allIssues.filter((issue: Issue) => issue.status === 'todo'),
    [allIssues]
  )

  const inProgressIssues = useMemo(() => 
    allIssues.filter((issue: Issue) => issue.status === 'in_progress'),
    [allIssues]
  )

  const doneIssues = useMemo(() => 
    allIssues.filter((issue: Issue) => issue.status === 'done'),
    [allIssues]
  )

  const openIssuesCount = useMemo(() => 
    todoIssues.length + inProgressIssues.length,
    [todoIssues.length, inProgressIssues.length]
  )

  return {
    isLoading: isLoading || !isReady,
    error,
    allIssues,
    todoIssues,
    inProgressIssues,
    doneIssues,
    openIssuesCount,
  }
}