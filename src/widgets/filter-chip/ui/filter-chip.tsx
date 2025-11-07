"use client"

import { X } from "lucide-react"

import { cn } from "@/shared/lib/utils"

interface FilterChipProps {
  label: string
  selected?: boolean
  onToggle?: () => void
  onRemove?: () => void
  variant?: "default" | "removable"
}

export function FilterChip({ label, selected = false, onToggle, onRemove, variant = "default" }: FilterChipProps) {
  if (variant === "removable") {
    return (
      <button
        onClick={onRemove}
        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex flex-shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
      >
        {label}
        <X className="h-3 w-3" />
      </button>
    )
  }

  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
        selected
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      )}
    >
      {label}
    </button>
  )
}
