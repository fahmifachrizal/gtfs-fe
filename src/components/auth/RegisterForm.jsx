import React, { useState } from "react"
import { Link } from "react-router-dom"
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"
import { useRegister } from "@/hooks/useAuth"
import { useForm } from "@/hooks/useForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export default function RegisterForm() {
  const { handleRegister, isLoading, error, validationErrors } = useRegister()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  const { values, errors, handleSubmit, getFieldProps } = useForm(
    {
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    {
      first_name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        requiredMessage: "First name is required",
        minLengthMessage: "First name must be at least 2 characters",
        maxLengthMessage: "First name must be no more than 50 characters",
      },
      last_name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        requiredMessage: "Last name is required",
        minLengthMessage: "Last name must be at least 2 characters",
        maxLengthMessage: "Last name must be no more than 50 characters",
      },
      username: {
        required: true,
        minLength: 3,
        maxLength: 30,
        pattern: /^[a-zA-Z0-9_-]+$/,
        requiredMessage: "Username is required",
        minLengthMessage: "Username must be at least 3 characters",
        maxLengthMessage: "Username must be no more than 30 characters",
        patternMessage:
          "Username can only contain letters, numbers, hyphens, and underscores",
      },
      email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        requiredMessage: "Email is required",
        patternMessage: "Please enter a valid email address",
      },
      password: {
        required: true,
        minLength: 8,
        requiredMessage: "Password is required",
        minLengthMessage: "Password must be at least 8 characters",
        validate: (value) => {
          const hasUpperCase = /[A-Z]/.test(value)
          const hasLowerCase = /[a-z]/.test(value)
          const hasNumbers = /\d/.test(value)
          const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)

          if (!hasUpperCase)
            return "Password must contain at least one uppercase letter"
          if (!hasLowerCase)
            return "Password must contain at least one lowercase letter"
          if (!hasNumbers) return "Password must contain at least one number"
          if (!hasSpecialChar)
            return "Password must contain at least one special character"

          return null
        },
      },
      confirmPassword: {
        required: true,
        requiredMessage: "Please confirm your password",
        validate: (value, allValues) => {
          if (value !== allValues.password) {
            return "Passwords do not match"
          }
          return null
        },
      },
    }
  )

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" }

    let score = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    }

    score = Object.values(checks).filter(Boolean).length

    if (score < 2)
      return {
        strength: score,
        label: "Weak",
        color: "text-red-600",
        bgColor: "bg-red-200",
      }
    if (score < 4)
      return {
        strength: score,
        label: "Medium",
        color: "text-yellow-600",
        bgColor: "bg-yellow-200",
      }
    return {
      strength: score,
      label: "Strong",
      color: "text-green-600",
      bgColor: "bg-green-200",
    }
  }

  const passwordStrength = getPasswordStrength(values.password)

  const onSubmit = async (formData) => {
    if (!acceptTerms) {
      alert("Please accept the terms and conditions to continue")
      return
    }

    await handleRegister(formData)
  }

  const getAllErrors = (field) => {
    return errors[field] || (validationErrors && validationErrors[field])
  }

  return (
    <div className="w-full max-w-lg space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Create Account</h2>
        <p className="text-muted-foreground mt-2">
          Join us to start creating and managing your GTFS projects
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Registration failed</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="first_name"
              placeholder="John"
              {...getFieldProps("first_name")}
              className={cn(
                getAllErrors("first_name") &&
                  "border-red-500 focus:border-red-500"
              )}
            />
            {getAllErrors("first_name") && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {getAllErrors("first_name")}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="last_name"
              placeholder="Doe"
              {...getFieldProps("last_name")}
              className={cn(
                getAllErrors("last_name") &&
                  "border-red-500 focus:border-red-500"
              )}
            />
            {getAllErrors("last_name") && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {getAllErrors("last_name")}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">
            Username <span className="text-red-500">*</span>
          </Label>
          <Input
            id="username"
            placeholder="johndoe"
            {...getFieldProps("username")}
            className={cn(
              getAllErrors("username") && "border-red-500 focus:border-red-500"
            )}
          />
          {getAllErrors("username") && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {getAllErrors("username")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...getFieldProps("email")}
            className={cn(
              getAllErrors("email") && "border-red-500 focus:border-red-500"
            )}
          />
          {getAllErrors("email") && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {getAllErrors("email")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...getFieldProps("password")}
              className={cn(
                "pr-10",
                getAllErrors("password") &&
                  "border-red-500 focus:border-red-500"
              )}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>

          {values.password && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Password strength:
                </span>
                <span
                  className={cn("text-sm font-medium", passwordStrength.color)}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all",
                    passwordStrength.bgColor
                  )}
                  style={{
                    width: `${(passwordStrength.strength / 5) * 100}%`,
                  }}></div>
              </div>
            </div>
          )}

          {getAllErrors("password") && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {getAllErrors("password")}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              {...getFieldProps("confirmPassword")}
              className={cn(
                "pr-10",
                getAllErrors("confirmPassword") &&
                  "border-red-500 focus:border-red-500"
              )}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>

          {getAllErrors("confirmPassword") && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {getAllErrors("confirmPassword")}
            </p>
          )}

          {!getAllErrors("confirmPassword") &&
            values.confirmPassword &&
            values.password === values.confirmPassword && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Passwords match
              </p>
            )}
        </div>

        <div className="flex items-start space-x-2">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={setAcceptTerms}
            className="mt-1"
          />
          <Label htmlFor="terms" className="text-sm font-normal leading-6">
            I agree to the{" "}
            <Link to="/terms" className="text-white font-bold hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-white font-bold hover:underline">
              Privacy Policy
            </Link>
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !acceptTerms}>
          {isLoading ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-white hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
