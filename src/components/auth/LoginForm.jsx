import React from "react"
import { useLogin } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "@/hooks/useForm"
import { Link } from "react-router-dom"

export default function LoginForm() {
  const { handleLogin, isLoading, error } = useLogin()

  const { values, errors, handleSubmit, getFieldProps } = useForm(
    {
      email: "",
      password: "",
    },
    {
      email: {
        required: true,
        validate: (value) => {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          const usernamePattern = /^[a-zA-Z0-9_-]{3,30}$/

          if (!emailPattern.test(value) && !usernamePattern.test(value)) {
            return "Please enter a valid email address or username"
          }
          return null
        },
        requiredMessage: "Email or username is required",
      },
      password: {
        required: true,
        minLength: 8,
        requiredMessage: "Password is required",
        minLengthMessage: "Password must be at least 8 characters",
      },
    }
  )

  const onSubmit = async (formData) => {
    await handleLogin(formData)
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Sign In</h2>
        <p className="text-muted-foreground mt-2">
          Enter your credentials to access your account
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email or Username</Label>
          <Input
            id="email"
            name="email"
            type="text"
            placeholder="your@email.com or username"
            {...getFieldProps("email")}
            autoComplete="username"
            className={
              errors.email ? "border-red-500 focus:border-red-500" : ""
            }
          />
          {errors.email && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            You can sign in with either your email address or username
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            {...getFieldProps("password")}
            autoComplete="current-password"
            className={
              errors.password ? "border-red-500 focus:border-red-500" : ""
            }
          />
          {errors.password && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.password}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          <Link
            to="/forgot-password"
            className="text-primary hover:underline">
            Forgot your password?
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
