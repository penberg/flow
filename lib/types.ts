export interface Issue {
  id: string
  issue_number: number
  title: string
  description: string | null
  status: "todo" | "in_progress" | "done"
  priority: "low" | "medium" | "high" | "urgent"
  assignee: string | null
  created_at: string
  updated_at: string
}

export type CreateIssueData = Omit<Issue, "id" | "issue_number" | "created_at" | "updated_at">
export type UpdateIssueData = Partial<CreateIssueData>
