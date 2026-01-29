import React from "react"
import { Outlet } from "react-router-dom"
// import { Toaster } from "@/components/ui/toaster"

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <main className="relative flex min-h-screen flex-col">
        <Outlet />
      </main>
      {/* <Toaster /> */}
    </div>
  )
}
