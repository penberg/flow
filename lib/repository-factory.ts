import type { IssueRepository } from "./repository"
import { TursoRepository } from "./turso-repository"
import { MemoryRepository } from "./memory-repository"

let repository: IssueRepository | null = null

export function getRepository(): IssueRepository {
  if (repository) return repository

  // Use in-memory repository in browser (v0 preview)
  if (typeof window !== "undefined") {
    console.warn("[v0 preview] Using in-memory repository")
    repository = new MemoryRepository()
    return repository
  }

  // Use Turso repository on server
  repository = new TursoRepository()
  return repository
}
