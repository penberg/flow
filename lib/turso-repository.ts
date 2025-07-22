import "server-only"
import { connect } from "@tursodatabase/serverless"
import type { Client } from "@tursodatabase/serverless"
import type { Issue, CreateIssueData, UpdateIssueData } from "./types"
import type { IssueRepository } from "./repository"

export class TursoRepository implements IssueRepository {
  private client: Client | null = null
  private schemaReady = false

  private async getClient(): Promise<Client> {
    if (this.client) return this.client

    const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = process.env
    if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
      throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables")
    }

    try {
      this.client = connect({
        url: TURSO_DATABASE_URL.replace(/^libsql:\/\//, "https://"),
        authToken: TURSO_AUTH_TOKEN,
      })
      console.log("[Turso] Connected to database")
      return this.client
    } catch (error) {
      console.error("[Turso] Failed to connect:", error)
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async ensureSchema(): Promise<void> {
    if (this.schemaReady) return

    console.log("[Turso] Ensuring database schema…")
    const client = await this.getClient()

    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS issues (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'todo'
            CHECK(status IN ('todo','in_progress','done')),
          priority TEXT NOT NULL DEFAULT 'medium'
            CHECK(priority IN ('low','medium','high','urgent')),
          assignee TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      await client.execute(`
        CREATE TRIGGER IF NOT EXISTS update_issues_updated_at
          AFTER UPDATE ON issues
          FOR EACH ROW
        BEGIN
          UPDATE issues
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.id;
        END;
      `)

      this.schemaReady = true
      console.log("[Turso] Database schema ready")
    } catch (error) {
      console.error("[Turso] Schema creation failed:", error)
      throw new Error(`Schema setup failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getAll(): Promise<Issue[]> {
    try {
      const client = await this.getClient()
      await this.ensureSchema()

      const result = await client.execute("SELECT * FROM issues ORDER BY created_at DESC")
      console.log(`[Turso] Retrieved ${result.rows.length} issues`)

      // Debug: Log the raw data structure
      if (result.rows.length > 0) {
        console.log("[Turso] RAW FIRST ROW:", JSON.stringify(result.rows[0], null, 2))
        console.log("[Turso] RAW FIRST ROW KEYS:", Object.keys(result.rows[0]))
      }

      // Convert rows to proper Issue objects with explicit type conversion
      const issues: Issue[] = result.rows.map((row: any) => {
        const issue = {
          id: Number(row.id),
          title: String(row.title || ""),
          description: row.description ? String(row.description) : null,
          status: String(row.status || "todo") as Issue["status"],
          priority: String(row.priority || "medium") as Issue["priority"],
          assignee: row.assignee ? String(row.assignee) : null,
          created_at: String(row.created_at || ""),
          updated_at: String(row.updated_at || ""),
        }

        console.log("[Turso] CONVERTED ISSUE:", JSON.stringify(issue, null, 2))
        return issue
      })

      return issues
    } catch (error) {
      console.error("[Turso] getAll failed:", error)
      throw new Error(`Failed to fetch issues: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async create(data: CreateIssueData): Promise<void> {
    try {
      const client = await this.getClient()
      await this.ensureSchema()

      console.log("[Turso] Creating issue with data:", JSON.stringify(data, null, 2))

      await client.execute({
        sql: "INSERT INTO issues (title, description, status, priority, assignee) VALUES (?, ?, ?, ?, ?)",
        args: [data.title, data.description ?? null, data.status, data.priority, data.assignee ?? null],
      })

      console.log("[Turso] Issue created successfully")
    } catch (error) {
      console.error("[Turso] create failed:", error)
      throw new Error(`Failed to create issue: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async update(id: number, data: UpdateIssueData): Promise<void> {
    try {
      const client = await this.getClient()
      await this.ensureSchema()

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

      if (!sets.length) return

      args.push(id)
      await client.execute({
        sql: `UPDATE issues SET ${sets.join(", ")} WHERE id = ?`,
        args,
      })

      console.log("[Turso] Issue updated successfully")
    } catch (error) {
      console.error("[Turso] update failed:", error)
      throw new Error(`Failed to update issue: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const client = await this.getClient()
      await this.ensureSchema()

      await client.execute({
        sql: "DELETE FROM issues WHERE id = ?",
        args: [id],
      })

      console.log("[Turso] Issue deleted successfully")
    } catch (error) {
      console.error("[Turso] delete failed:", error)
      throw new Error(`Failed to delete issue: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}
