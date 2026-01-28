// app/profile/page.js
"use client"
import React from "react"
import { AuthGuard } from "@/components/auth/AuthGuard"
import ProfileSettings from "@/components/profile/ProfileSettings"

export default function ProfilePage() {
  return (
    <AuthGuard>
      <div className="container mx-auto py-8">
        <ProfileSettings />
      </div>
    </AuthGuard>
  )
}