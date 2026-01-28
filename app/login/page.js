// app/login/page.js
"use client"
import React from "react"
import { GuestGuard } from "@/components/auth/GuestGuard"
import LoginForm from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <GuestGuard>
      <div className="min-h-screen flex items-center justify-center">
        <LoginForm />
      </div>
    </GuestGuard>
  )
}