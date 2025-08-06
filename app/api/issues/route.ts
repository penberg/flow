import { NextRequest, NextResponse } from "next/server"
import { getRepository } from "@/lib/repository-factory"
import type { CreateIssueData } from "@/lib/types"

export async function GET() {
  try {
    const repo = getRepository()
    const issues = await repo.getAll()
    return NextResponse.json(issues)
  } catch (error) {
    console.error("[API] GET /api/issues failed:", error)
    return NextResponse.json(
      { error: "Failed to fetch issues" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id: clientId, ...data }: { id?: string } & CreateIssueData = body

    if (!data.title || data.title.trim() === "") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    if (!data.status || !["todo", "in_progress", "done"].includes(data.status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }

    if (!data.priority || !["low", "medium", "high", "urgent"].includes(data.priority)) {
      return NextResponse.json(
        { error: "Invalid priority" },
        { status: 400 }
      )
    }

    const repo = getRepository()
    await repo.create(data, clientId)

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("[API] POST /api/issues failed:", error)
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    )
  }
}