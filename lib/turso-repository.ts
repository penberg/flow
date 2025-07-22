import "server-only"
import { connect } from "@tursodatabase/serverless"
import type { Client } from "@tursodatabase/serverless"
import type { Issue, CreateIssueData, UpdateIssueData } from "./types"
import type { IssueRepository } from "./repository"
import { SEED_ISSUES } from "./seed-data"

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

    console.log("[Turso] Ensuring database schema...")
    const client = await this.getClient()

    try {
      await client.batch([
        `CREATE TABLE IF NOT EXISTS issues (
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
        )`,
        `CREATE TRIGGER IF NOT EXISTS update_issues_updated_at
          AFTER UPDATE ON issues
          FOR EACH ROW
        BEGIN
          UPDATE issues
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.id;
        END;`,
      ])

      // Check if we need to seed data
      const countResult = await client.execute("SELECT COUNT(*) as count FROM issues")
      const count = (countResult.rows[0] as any).count

      if (count === 0) {
        console.log("[Turso] Seeding initial data...")
        for (const issue of SEED_ISSUES) {
          await client.execute({
            sql: "INSERT INTO issues (title, description, status, priority, assignee) VALUES (?, ?, ?, ?, ?)",
            args: [issue.title, issue.description ?? null, issue.status, issue.priority, issue.assignee ?? null],
          })
        }
        console.log(`[Turso] Seeded ${SEED_ISSUES.length} issues`)
      }

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
      return result.rows as Issue[]
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
