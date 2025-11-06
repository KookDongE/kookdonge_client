import type { ClubStatus } from "@/entities/club"
import { cn } from "@/shared/lib/utils"

interface StatusBadgeProps {
  status: ClubStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusText = {
    RECRUITING: "모집중",
    SCHEDULED: "모집예정",
    CLOSED: "모집마감",
  }[status]

  const statusColor = {
    RECRUITING: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    SCHEDULED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  }[status]

  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", statusColor, className)}
    >
      {statusText}
    </span>
  )
}
