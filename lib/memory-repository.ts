import type { Issue, CreateIssueData, UpdateIssueData } from "./types"
import type { IssueRepository } from "./repository"

export class MemoryRepository implements IssueRepository {
  private get store() {
    const globalStore = (globalThis as any).__FAKE_DB__ ?? { issues: [], nextId: 1 }
    ;(globalThis as any).__FAKE_DB__ = globalStore
    return globalStore
  }

  async ensureSchema(): Promise<void> {
    // No-op for in-memory
    console.log("[Memory] Schema ready (in-memory)")
  }

  async getAll(): Promise<Issue[]> {
    return [...this.store.issues].reverse()
  }

  async create(data: CreateIssueData): Promise<void> {
    const now = new Date().toISOString()
    const issue: Issue = {
      id: this.store.nextId++,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignee: data.assignee,
      created_at: now,
      updated_at: now,
    }
    this.store.issues.push(issue)
  }

  async update(id: number, data: UpdateIssueData): Promise<void> {
    const issue = this.store.issues.find((i: Issue) => i.id === id)
    if (!issue) return

    if (data.title !== undefined) issue.title = data.title
    if (data.description !== undefined) issue.description = data.description
    if (data.status !== undefined) issue.status = data.status
    if (data.priority !== undefined) issue.priority = data.priority
    if (data.assignee !== undefined) issue.assignee = data.assignee
    issue.updated_at = new Date().toISOString()
  }

  async delete(id: number): Promise<void> {
    const index = this.store.issues.findIndex((i: Issue) => i.id === id)
    if (index !== -1) {
      this.store.issues.splice(index, 1)
    }
  }
}
