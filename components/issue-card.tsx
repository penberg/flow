"use client"

import type { Issue } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface IssueCardProps {
  issue: Issue
  onUpdate: (id: string, updates: any) => void
  onDelete: (id: string) => void
}

const statusColors = {
  todo: "bg-gray-100 text-gray-800 border-gray-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  done: "bg-green-100 text-green-800 border-green-200",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
}

const statusLabels = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done",
}

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

export function IssueCard({ issue, onUpdate, onDelete }: IssueCardProps) {
  const handleStatusChange = (newStatus: Issue["status"]) => {
    onUpdate(issue.id, { status: newStatus })
  }

  const handleDelete = () => {
    onDelete(issue.id)
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">FL-{issue.issue_number}</span>
            <Badge variant="outline" className={priorityColors[issue.priority]}>
              {priorityLabels[issue.priority]}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h3 className="font-semibold text-sm leading-tight">{issue.title}</h3>
      </CardHeader>
      <CardContent className="pt-0">
        {issue.description && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{issue.description}</p>}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {issue.assignee && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                  {issue.assignee
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <span className="text-xs text-muted-foreground">{issue.assignee}</span>
              </div>
            )}
          </div>
          <Select value={issue.status} onValueChange={handleStatusChange}>
            <SelectTrigger className={`w-auto h-7 text-xs border ${statusColors[issue.status]}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
