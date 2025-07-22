// lib/schema.ts
import type { Client } from "@tursodatabase/serverless"

let schemaReady = false

/**
 * Ensures the `issues` table (and its trigger) exist.
 * The function is idempotent and costs ~0 ms after the first call
 * because the second invocation is a no-op.
 */
export async function ensureSchema(client: Client) {
  if (schemaReady) return

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

  schemaReady = true
}
