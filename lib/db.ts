'use client'

import { createCollection } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/query-core'
import type { Issue } from './types'

const queryClient = new QueryClient()

export const issuesCollection = createCollection(
  queryCollectionOptions({
    id: 'issues',
    queryKey: ['issues'],
    queryClient,
    getKey: (issue: Issue) => issue.id,
    
    queryFn: async () => {
      const response = await fetch('/api/issues')
      if (!response.ok) throw new Error('Failed to fetch issues')
      return response.json()
    },
    
    onInsert: async ({ transaction }) => {
      return Promise.all(
        transaction.mutations.map(async (mutation) => {
          const { issue_number, created_at, updated_at, ...data } = mutation.modified
          const response = await fetch('/api/issues', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          if (!response.ok) throw new Error('Failed to create issue')
          return response.json()
        })
      )
    },
    
    onUpdate: async ({ transaction }) => {
      return Promise.all(
        transaction.mutations.map(async (mutation) => {
          const response = await fetch(`/api/issues/${mutation.key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mutation.changes),
          })
          if (!response.ok) throw new Error('Failed to update issue')
          return response.json()
        })
      )
    },
    
    onDelete: async ({ transaction }) => {
      return Promise.all(
        transaction.mutations.map(async (mutation) => {
          const response = await fetch(`/api/issues/${mutation.key}`, {
            method: 'DELETE',
          })
          if (!response.ok) throw new Error('Failed to delete issue')
        })
      )
    },
  })
)

