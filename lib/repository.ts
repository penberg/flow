import type { Issue, CreateIssueData, UpdateIssueData } from "./types"

export interface IssueRepository {
  getAll(): Promise<Issue[]>
  create(data: CreateIssueData, clientId?: string): Promise<void>
  update(id: string, data: UpdateIssueData): Promise<void>
  delete(id: string): Promise<void>
  ensureSchema(): Promise<void>
}
