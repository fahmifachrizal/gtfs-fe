import React from "react"
import { GuestGuard } from "@/components/auth/GuestGuard"
import RegisterForm from "@/components/auth/RegisterForm"

export default function Register() {
  return (
    <GuestGuard>
      <div className="min-h-screen flex items-center justify-center">
        <RegisterForm />
      </div>
    </GuestGuard>
  )
}
