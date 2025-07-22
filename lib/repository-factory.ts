import type { IssueRepository } from "./repository"
import { TursoRepository } from "./turso-repository"

let repository: IssueRepository | null = null

export function getRepository(): IssueRepository {
  if (repository) return repository

  repository = new TursoRepository()
  return repository
}
