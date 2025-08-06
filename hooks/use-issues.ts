'use client'

import { useLiveQuery } from '@tanstack/react-db'
import { issuesCollection } from '@/lib/db'
import { useEffect, useState, useMemo } from 'react'
import type { Issue } from '@/lib/types'

export function useIssues() {
  console.log('🔍 HOOK - useIssues called, collection status:', issuesCollection.status)

  // Preload the collection data and wait for it to be ready
  useEffect(() => {
    console.log('🔍 HOOK - Preloading query collection data')
    issuesCollection.preload()
      .then(() => {
        console.log('🔍 HOOK - Query collection preloaded successfully')
        console.log('🔍 HOOK - Collection state after preload:', issuesCollection.state)
        console.log('🔍 HOOK - Collection keys after preload:', Array.from(issuesCollection.keys()))
        console.log('🔍 HOOK - Collection status after preload:', issuesCollection.status)
      })
      .catch((error) => {
        console.error('🚨 HOOK - Query collection preload failed:', error)
      })
  }, [])

  // Use TanStack DB live query
  console.log('🔍 HOOK - About to call useLiveQuery')
  const result = useLiveQuery((q) => {
    console.log('🔍 HOOK - useLiveQuery callback called')
    console.log('🔍 HOOK - Collection status in query:', issuesCollection.status)
    console.log('🔍 HOOK - Collection state size in query:', issuesCollection.state?.size)
    const query = q.from({ issues: issuesCollection })
    console.log('🔍 HOOK - Query created, returning')
    return query
  })
  
  console.log('🔍 HOOK - useLiveQuery result:', {
    data: result.data,
    dataLength: result.data?.length,
    isLoading: result.isLoading,
    isReady: result.isReady,
    isError: result.isError,
    status: result.status
  })

  const { data: allIssues = [], isLoading, isReady, isError, error } = result

  // Filter issues client-side using useMemo for performance
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

  // Calculate open issues count (todo + in_progress)
  const openIssuesCount = useMemo(() => 
    todoIssues.length + inProgressIssues.length,
    [todoIssues.length, inProgressIssues.length]
  )

  console.log('🔍 HOOK - Final return values:', {
    isLoading,
    isReady,
    isError,
    error,
    allIssuesLength: allIssues.length,
    todoIssuesLength: todoIssues.length,
    inProgressIssuesLength: inProgressIssues.length,
    doneIssuesLength: doneIssues.length
  })

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