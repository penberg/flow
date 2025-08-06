import { NextRequest, NextResponse } from "next/server"
import { getRepository } from "@/lib/repository-factory"
import type { UpdateIssueData } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: "Invalid issue ID" },
        { status: 400 }
      )
    }

    const repo = getRepository()
    const issue = await repo.findById(id)
    
    if (!issue) {
      return NextResponse.json(
        { error: "Issue not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(issue)
  } catch (error) {
    console.error(`[API] GET /api/issues/${(await params).id} failed:`, error)
    return NextResponse.json(
      { error: "Failed to get issue" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: "Invalid issue ID" },
        { status: 400 }
      )
    }

    const data: UpdateIssueData = await request.json()
    
    const repo = getRepository()
    await repo.update(id, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[API] PUT /api/issues/${params.id} failed:`, error)
    return NextResponse.json(
      { error: "Failed to update issue" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id || id.trim() === '') {
      return NextResponse.json(
        { error: "Invalid issue ID" },
        { status: 400 }
      )
    }

    const repo = getRepository()
    await repo.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[API] DELETE /api/issues/${params.id} failed:`, error)
    return NextResponse.json(
      { error: "Failed to delete issue" },
      { status: 500 }
    )
  }
}