// components/profile/ProfileSettings.js
"use client"
import React from "react"
import { useProfile, usePreferences } from "@/hooks/useAuth"
import { useForm } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfileSettings() {
  const { user, updateProfile, isProfileLoading } = useProfile()
  const { preferences, savePreferences, hasUnsavedChanges } = usePreferences()

  const {
    values,
    errors,
    handleSubmit,
    getFieldProps
  } = useForm({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    username: user?.username || ''
  })

  const onSubmit = async (formData) => {
    await updateProfile(formData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <Avatar className="h-24 w-24 mx-auto mb-4">
          <AvatarImage src={user?.avatar_url} />
          <AvatarFallback className="text-2xl">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              {...getFieldProps('first_name')}
            />
            {errors.first_name && (
              <p className="text-sm text-red-600">{errors.first_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              {...getFieldProps('last_name')}
            />
            {errors.last_name && (
              <p className="text-sm text-red-600">{errors.last_name}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...getFieldProps('email')}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            {...getFieldProps('username')}
          />
          {errors.username && (
            <p className="text-sm text-red-600">{errors.username}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isProfileLoading}
        >
          {isProfileLoading ? "Updating..." : "Update Profile"}
        </Button>
      </form>
    </div>
  )
}