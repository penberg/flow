import type { Issue, CreateIssueData, UpdateIssueData } from "./types"

export interface IssueRepository {
  getAll(): Promise<Issue[]>
  create(data: CreateIssueData): Promise<void>
  update(id: number, data: UpdateIssueData): Promise<void>
  delete(id: number): Promise<void>
  ensureSchema(): Promise<void>
}
