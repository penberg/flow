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
  console.log("[Server Action] createIssue called")

  try {
    const repo = getRepository()
    await repo.create(data)
    revalidatePath("/")
    console.log("[Server] Issue created successfully")
  } catch (error) {
    console.error("[Server] createIssue failed:", error)
    throw error
  }
}

export async function updateIssue(id: number, data: UpdateIssueData) {
  console.log("[Server Action] updateIssue called")

  try {
    const repo = getRepository()
    await repo.update(id, data)
    revalidatePath("/")
    console.log("[Server] Issue updated successfully")
  } catch (error) {
    console.error("[Server] updateIssue failed:", error)
    throw error
  }
}

export async function deleteIssue(id: number) {
  console.log("[Server Action] deleteIssue called")

  try {
    const repo = getRepository()
    await repo.delete(id)
    revalidatePath("/")
    console.log("[Server] Issue deleted successfully")
  } catch (error) {
    console.error("[Server] deleteIssue failed:", error)
    throw error
  }
}
