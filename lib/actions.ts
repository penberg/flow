"use server" // ← NEW: mark entire module as server-only
import { getTursoClient } from "./db"
import { ensureSchema } from "./schema"
import type { Issue, CreateIssueData, UpdateIssueData } from "./types"
import { revalidatePath } from "next/cache"

async function withClient<T>(fn: (c: ReturnType<typeof getTursoClient>) => Promise<T>) {
  const client = await getTursoClient()
  await ensureSchema(client)
  return fn(client)
}

export async function getIssues(): Promise<Issue[]> {
  return withClient(async (client) => {
    const res = await client.execute("SELECT * FROM issues ORDER BY created_at DESC")
    return res.rows as Issue[]
  })
}

export async function createIssue(data: CreateIssueData) {
  return withClient(async (client) => {
    const stmt = client.prepare(
      "INSERT INTO issues (title, description, status, priority, assignee) VALUES (?, ?, ?, ?, ?)",
    )
    await stmt.execute([data.title, data.description ?? null, data.status, data.priority, data.assignee ?? null])
    revalidatePath("/")
  })
}

export async function updateIssue(id: number, data: UpdateIssueData) {
  return withClient(async (client) => {
    const sets: string[] = []
    const args: unknown[] = []

    if (data.title !== undefined) {
      sets.push("title = ?")
      args.push(data.title)
    }
    if (data.description !== undefined) {
      sets.push("description = ?")
      args.push(data.description)
    }
    if (data.status !== undefined) {
      sets.push("status = ?")
      args.push(data.status)
    }
    if (data.priority !== undefined) {
      sets.push("priority = ?")
      args.push(data.priority)
    }
    if (data.assignee !== undefined) {
      sets.push("assignee = ?")
      args.push(data.assignee)
    }

    if (!sets.length) return // nothing to update

    args.push(id)
    const stmt = client.prepare(`UPDATE issues SET ${sets.join(", ")} WHERE id = ?`)
    await stmt.execute(args)
    revalidatePath("/")
  })
}

export async function deleteIssue(id: number) {
  return withClient(async (client) => {
    await client.prepare("DELETE FROM issues WHERE id = ?").execute([id])
    revalidatePath("/")
  })
}
