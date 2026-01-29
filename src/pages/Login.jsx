import React from "react"
import { GuestGuard } from "@/components/auth/GuestGuard"
import LoginForm from "@/components/auth/LoginForm"

export default function Login() {
  return (
    <GuestGuard>
      <div className="min-h-screen flex items-center justify-center">
        <LoginForm />
      </div>
    </GuestGuard>
  )
}
