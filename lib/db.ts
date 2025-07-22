"use server"
import "server-only"
import { connect } from "@tursodatabase/serverless"

let _client: ReturnType<typeof connect> | null = null
let logged = false

function pickEnv(): { url?: string; token?: string } {
  /* 1️⃣  Build-time injected values for the preview (preferred there) */
  const urlPublic = process.env.NEXT_PUBLIC_TURSO_DATABASE_URL

  /* 2️⃣  Secure, runtime values (used in prod / real server) */
  const urlServer = process.env.TURSO_DATABASE_URL
  const tokenServer = process.env.TURSO_AUTH_TOKEN

  return {
    url: (urlPublic ?? urlServer)?.trim(),
    token: tokenServer?.trim(), // ✅ only the secure key
  }
}

export async function getTursoClient() {
  if (_client) return _client

  const { url: rawUrl, token } = pickEnv()

  if (!rawUrl || !token) {
    throw new Error(
      "❌ Turso credentials are missing.\n" +
        "• NEXT_PUBLIC_TURSO_DATABASE_URL or TURSO_DATABASE_URL\n" +
        "• TURSO_AUTH_TOKEN must be set in Project Settings → Environment Variables.",
    )
  }

  // Browsers can’t fetch libsql:// – translate automatically:
  const url = rawUrl.startsWith("libsql://") ? rawUrl.replace(/^libsql:\/\//, "https://") : rawUrl

  if (!logged) {
    console.info(
      `[Turso] Using URL ${url.slice(0, 30)}… ` +
        `(source: ${rawUrl === process.env.NEXT_PUBLIC_TURSO_DATABASE_URL ? "NEXT_PUBLIC" : "SERVER"})`,
    )
    logged = true
  }

  _client = connect({ url, authToken: token })
  return _client
}
