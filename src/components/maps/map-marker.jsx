import { cn } from "@/lib/utils"
import React from "react"

export default function MapMarker(color = "orange") {
  // Color mapping
  const colorMap = {
    orange: "bg-orange-500",
    red: "bg-red-500",
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    yellow: "bg-yellow-500",
    pink: "bg-pink-500",
    indigo: "bg-indigo-500",
    cyan: "bg-cyan-500",
    emerald: "bg-emerald-500",
  }

  const bgColor = colorMap[color] || colorMap.orange

  // Blue markers get white border for better visibility
  const borderClass = color === "blue" ? "border-2 border-white" : "border-none"

  const className = cn("w-3 h-3 z-0 rounded-full", bgColor, borderClass)

  return `<div class="${className}"></div>`
}
