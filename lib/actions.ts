"use server"

import { getRepository } from "./repository-factory"
import type { Issue, CreateIssueData, UpdateIssueData } from "./types"
import { revalidatePath } from "next/cache"

export async function getIssues(): Promise<Issue[]> {
  console.log("[Server Action] getIssues called")

  try {
    const repo = getRepository()
    const issues = await repo.getAll()
    console.log(`[Server] Found ${issues.length} issues`)
    return issues
  } catch (error) {
    console.error("[Server] getIssues failed:", error)
    throw new Error(`Database query failed: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function createIssue(data: CreateIssueData) {
  console.log("[Server Action] createIssue called with:", JSON.stringify(data, null, 2))

  try {
    // Validate required fields
    if (!data.title || data.title.trim() === "") {
      throw new Error("Title is required")
    }

    if (!data.status || !["todo", "in_progress", "done"].includes(data.status)) {
      throw new Error("Invalid status")
    }

    if (!data.priority || !["low", "medium", "high", "urgent"].includes(data.priority)) {
      throw new Error("Invalid priority")
    }

    const repo = getRepository()
    await repo.create(data)

    console.log("[Server] Issue created successfully")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("[Server] createIssue failed:", error)

    // Return a more specific error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    throw new Error(`Failed to create issue: ${errorMessage}`)
  }
}

export async function updateIssue(id: number, data: UpdateIssueData) {
  console.log("[Server Action] updateIssue called with id:", id, "data:", JSON.stringify(data, null, 2))

  try {
    if (!id || id <= 0) {
      throw new Error("Invalid issue ID")
    }

    const repo = getRepository()
    await repo.update(id, data)

    console.log("[Server] Issue updated successfully")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("[Server] updateIssue failed:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    throw new Error(`Failed to update issue: ${errorMessage}`)
  }
}

export async function deleteIssue(id: number) {
  console.log("[Server Action] deleteIssue called with id:", id)

  try {
    if (!id || id <= 0) {
      throw new Error("Invalid issue ID")
    }

    const repo = getRepository()
    await repo.delete(id)

    console.log("[Server] Issue deleted successfully")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("[Server] deleteIssue failed:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    throw new Error(`Failed to delete issue: ${errorMessage}`)
  }
}
