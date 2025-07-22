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
      throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in env")
    }

    this.client = connect({
      url: TURSO_DATABASE_URL.replace(/^libsql:\/\//, "https://"),
      authToken: TURSO_AUTH_TOKEN,
    })
    return this.client
  }

  async ensureSchema(): Promise<void> {
    if (this.schemaReady) return

    console.log("[Turso] Ensuring database schema...")
    const client = await this.getClient()

    try {
      await client.batch(
        [
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
        ],
        "write",
      )

      // Check if we need to seed data
      const countResult = await client.execute("SELECT COUNT(*) as count FROM issues")
      const count = (countResult.rows[0] as any).count

      if (count === 0) {
        console.log("[Turso] Seeding initial data...")
        for (const issue of SEED_ISSUES) {
          await this.create(issue)
        }
        console.log(`[Turso] Seeded ${SEED_ISSUES.length} issues`)
      }

      this.schemaReady = true
      console.log("[Turso] Database schema ready")
    } catch (error) {
      console.error("[Turso] Schema creation failed:", error)
      throw error
    }
  }

  async getAll(): Promise<Issue[]> {
    const client = await this.getClient()
    await this.ensureSchema()

    const result = await client.execute("SELECT * FROM issues ORDER BY created_at DESC")
    return result.rows as Issue[]
  }

  async create(data: CreateIssueData): Promise<void> {
    const client = await this.getClient()
    await this.ensureSchema()

    const stmt = client.prepare(
      "INSERT INTO issues (title, description, status, priority, assignee) VALUES (?, ?, ?, ?, ?)",
    )
    await stmt.execute([data.title, data.description ?? null, data.status, data.priority, data.assignee ?? null])
  }

  async update(id: number, data: UpdateIssueData): Promise<void> {
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
    const stmt = client.prepare(`UPDATE issues SET ${sets.join(", ")} WHERE id = ?`)
    await stmt.execute(args)
  }

  async delete(id: number): Promise<void> {
    const client = await this.getClient()
    await this.ensureSchema()

    const stmt = client.prepare("DELETE FROM issues WHERE id = ?")
    await stmt.execute([id])
  }
}
