'use client'

import { createCollection, createTransaction } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/query-core'
import type { Issue } from './types'

// Create query client for TanStack Query integration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

// Create the issues collection using query collection pattern (NO SYNC CONFLICTS!)
console.log('🔄 CREATING TANSTACK DB COLLECTION WITH QUERY PATTERN')
export const issuesCollection = createCollection(
  queryCollectionOptions({
    id: 'issues',
    queryKey: ['issues'],
    queryClient,
    getKey: (issue: Issue) => issue.id,
    
    // Fetch function - only called when needed, not continuously
    queryFn: async () => {
      console.log('🔄 QUERY - Fetching fresh data from server')
      const response = await fetch('/api/issues')
      if (!response.ok) throw new Error('Failed to fetch issues')
      const issues = await response.json()
      console.log('🔄 QUERY - Fetched', issues.length, 'issues')
      return issues
    },
    
    // NO refetchInterval = no automatic polling that causes conflicts
    
    // Mutation handlers that sync with server
    onInsert: async ({ transaction }) => {
      console.log('🔼 INSERT HANDLER - Syncing to server')
      for (const mutation of transaction.mutations) {
        const { issue_number, created_at, updated_at, ...data } = mutation.modified
        const response = await fetch('/api/issues', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!response.ok) throw new Error('Failed to create issue')
      }
      console.log('🔼 INSERT HANDLER - Server sync complete, query will auto-refetch')
    },
    
    onUpdate: async ({ transaction }) => {
      console.log('🔼 UPDATE HANDLER - Syncing to server')
      for (const mutation of transaction.mutations) {
        console.log('🔼 UPDATE HANDLER - Sending update:', mutation.key, mutation.changes)
        const response = await fetch(`/api/issues/${mutation.key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutation.changes),
        })
        if (!response.ok) throw new Error('Failed to update issue')
      }
      console.log('🔼 UPDATE HANDLER - Server sync complete, query will auto-refetch')
    },
    
    onDelete: async ({ transaction }) => {
      console.log('🔼 DELETE HANDLER - Syncing to server')
      for (const mutation of transaction.mutations) {
        const response = await fetch(`/api/issues/${mutation.key}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to delete issue')
      }
      console.log('🔼 DELETE HANDLER - Server sync complete, query will auto-refetch')
    },
  })
)

// Hook to load initial data
export async function loadIssues() {
  const response = await fetch('/api/issues')
  if (!response.ok) {
    throw new Error('Failed to fetch issues')
  }
  const issues: Issue[] = await response.json()
  
  // Load issues into the collection using a transaction
  const transaction = createTransaction()
  transaction.replaceAll(issuesCollection, issues)
  await transaction.commit()
  
  return issues
}

// Mutation functions that sync with server
export async function createIssue(issue: Issue) {
  // Optimistically add to collection using collection's insert method
  const transaction = issuesCollection.insert(issue)
  
  // Wait for optimistic update to complete
  await transaction.isPersisted.promise
}

export async function updateIssue(id: string, updates: Partial<Issue>) {
  console.log('🔄 UPDATE - Attempting to update issue:', id, updates)
  console.log('🔄 UPDATE - Collection status:', issuesCollection.status)
  console.log('🔄 UPDATE - Collection ready:', issuesCollection.isReady())
  console.log('🔄 UPDATE - Collection keys:', Array.from(issuesCollection.keys()))
  
  // Ensure collection is ready and has data
  if (!issuesCollection.isReady() || issuesCollection.size === 0) {
    console.log('🔄 UPDATE - Collection not ready, waiting for data...')
    await issuesCollection.stateWhenReady()
    console.log('🔄 UPDATE - Collection is now ready with', issuesCollection.size, 'items')
  }
  
  console.log('🔄 UPDATE - Creating update transaction')
  const transaction = issuesCollection.update(id, (draft) => {
    console.log('🔄 UPDATE - Updating draft:', draft, 'with:', updates)
    Object.assign(draft, updates)
  })
  
  // Wait for optimistic update to complete
  console.log('🔄 UPDATE - Waiting for transaction to persist')
  await transaction.isPersisted.promise
  console.log('🔄 UPDATE - Transaction persisted successfully')
}

export async function deleteIssue(id: string) {
  // Optimistically delete using collection's delete method
  const transaction = issuesCollection.delete(id)
  
  // Wait for optimistic update to complete
  await transaction.isPersisted.promise
}