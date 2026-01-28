// components/ui/loading-spinner.js - Loading spinner component
"use client"
import React from "react"
import { cn } from "@/lib/utils"

export default function LoadingSpinner({
  size = "md",
  className = "",
  message = "Loading...",
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8",
        className
      )}>
      <div
        className={cn(
          "animate-spin rounded-full border-4 border-gray-300 border-t-blue-600",
          sizeClasses[size]
        )}
      />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  )
}
