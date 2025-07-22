import type { CreateIssueData } from "./types"

export const SEED_ISSUES: CreateIssueData[] = [
  {
    title: "Implement user authentication",
    description: "Add login and signup functionality with proper session management",
    status: "in_progress",
    priority: "high",
    assignee: "Alice Johnson",
  },
  {
    title: "Design new dashboard layout",
    description: "Create a modern and intuitive dashboard interface for better user experience",
    status: "todo",
    priority: "medium",
    assignee: "Bob Smith",
  },
  {
    title: "Fix mobile responsiveness",
    description: "Resolve layout issues on mobile devices, especially on smaller screens",
    status: "done",
    priority: "high",
    assignee: "Carol Davis",
  },
  {
    title: "Add dark mode support",
    description: "Implement dark/light theme toggle with proper color schemes",
    status: "todo",
    priority: "low",
    assignee: "David Wilson",
  },
  {
    title: "Optimize database queries",
    description: "Improve performance by optimizing slow database queries",
    status: "in_progress",
    priority: "urgent",
    assignee: "Eve Brown",
  },
]
