import "server-only"
import { connect } from "@tursodatabase/serverless"
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
      return this.client
    } catch (error) {
      console.error("[Turso] Failed to connect:", error)
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private escapeString(value: string | null): string {
    if (value === null) return "NULL"
    return `'${value.replace(/'/g, "''")}'`
  }

  async ensureSchema(): Promise<void> {
    if (this.schemaReady) return

    const client = await this.getClient()

    try {
      await client.exec(`
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

      await client.exec(`
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
    } catch (error) {
      console.error("[Turso] Schema creation failed:", error)
      throw new Error(`Schema setup failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async getAll(): Promise<Issue[]> {
    try {
      const client = await this.getClient()
      await this.ensureSchema()

      const stmt = await client.prepare("SELECT * FROM issues ORDER BY created_at DESC");
      const result = await stmt.all();
      const issues: Issue[] = result.map((row: any) => ({
        id: Number(row.id),
        title: String(row.title || ""),
        description: row.description ? String(row.description) : null,
        status: String(row.status || "todo") as Issue["status"],
        priority: String(row.priority || "medium") as Issue["priority"],
        assignee: row.assignee ? String(row.assignee) : null,
        created_at: String(row.created_at || ""),
        updated_at: String(row.updated_at || ""),
      }))

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

      const stmt = client.prepare(`
        INSERT INTO issues (title, description, status, priority, assignee) VALUES (?, ?, ?, ?, ?)
      `)

      await stmt.run([data.title, data.description, data.status, data.priority, data.assignee])
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

      if (data.title !== undefined) {
        sets.push(`title = ${this.escapeString(data.title)}`)
      }
      if (data.description !== undefined) {
        sets.push(`description = ${this.escapeString(data.description)}`)
      }
      if (data.status !== undefined) {
        sets.push(`status = ${this.escapeString(data.status)}`)
      }
      if (data.priority !== undefined) {
        sets.push(`priority = ${this.escapeString(data.priority)}`)
      }
      if (data.assignee !== undefined) {
        sets.push(`assignee = ${this.escapeString(data.assignee)}`)
      }

      if (!sets.length) return

      const sql = `UPDATE issues SET ${sets.join(", ")} WHERE id = ${id}`
      await client.exec(sql)
    } catch (error) {
      console.error("[Turso] update failed:", error)
      throw new Error(`Failed to update issue: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const client = await this.getClient()
      await this.ensureSchema()

      const stmt = client.prepare(`DELETE FROM issues WHERE id = ?`)
      await stmt.run([id])

    } catch (error) {
      console.error("[Turso] delete failed:", error)
      throw new Error(`Failed to delete issue: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}
