# Authentication System Reference Guide

## 🎯 **lib/auth.js - ABSOLUTE REFERENCE POINT**

This file is your **single source of truth** for all authentication and authorization logic. All other files should reference functions from this file.

## 🔒 **Core Authentication Principles**

### 1. **Token Payload Structure - STANDARDIZED**

```javascript
// JWT Token Payload (ONLY contains userId)
{
  userId: "user-uuid-here",  // ONLY user ID in token
  iat: 1234567890,          // Issued at timestamp
  exp: 1234567890           // Expiry timestamp
}
```

**Key Points:**

- ❌ **NEVER** store email, username, or other user data in JWT tokens
- ✅ **ALWAYS** use only `userId` in token payload
- ✅ **ALWAYS** fetch fresh user data from database using the `userId`

### 2. **Authentication Flow - STANDARDIZED**

#### **Step 1: Login (supports email OR username)**

```javascript
// In login route - use verifyUserCredentials()
const user = await verifyUserCredentials(emailOrUsername, password)
if (user) {
  const token = generateToken(user) // Only uses user.id
}
```

#### **Step 2: Request Authentication**

```javascript
// In API routes - use authenticateUser()
const user = await authenticateUser(request)
if (!user) {
  return 401 // Unauthorized
}
// user object contains fresh data from database
```

#### **Step 3: Authorization (Project Access)**

```javascript
// For project-specific operations
const accessResult = await checkProjectAccess(user.id, projectId, "EDITOR")
if (!accessResult.hasAccess) {
  return 403 // Forbidden
}
```

## 📚 **Function Reference**

### **Authentication Functions**

| Function | Purpose | Returns |
|----------|---------|---------|
| `authenticateUser(request)` | Get authenticated user from request | `User object \| null` |
| `verifyUserCredentials(emailOrUsername, password)` | Verify login credentials | `User object \| null` |
| `generateToken(user)` | Create JWT token | `string` |
| `verifyToken(token)` | Verify JWT token | `{userId, iat, exp} \| null` |

### **Authorization Functions**

| Function | Purpose | Returns |
|----------|---------|---------|
| `checkProjectAccess(userId, projectId, minRole)` | Check project permissions | `{hasAccess, role, project}` |

### **Middleware Functions** (in middleware/auth.js)

| Function | Purpose | Returns |
|----------|---------|---------|
| `requireAuth(request)` | Require authentication | `{user} \| 401 Response` |
| `requireProjectAccess(request, projectId, minRole)` | Require project access | `{user, project, role} \| Error Response` |
| `optionalAuth(request)` | Optional authentication | `{user \| null}` |

## 🔧 **How to Use in API Routes**

### **Basic Authentication**

```javascript
import { requireAuth } from "@/middleware/auth"

export async function POST(request) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult // Return auth error
  }

  const { user } = authResult
  // user.id is verified and fresh from database
}
```

### **Project-Based Authorization**

```javascript
import { requireProjectAccess } from "@/middleware/auth"

export async function POST(request) {
  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('project_id')

  const authResult = await requireProjectAccess(request, projectId, "EDITOR")
  if (authResult instanceof NextResponse) {
    return authResult // Return error
  }

  const { user, project, role } = authResult
  // User has EDITOR+ access to project
}
```

### **Manual Authentication (like GTFS upload)**

```javascript
import { authenticateUser } from "@/lib/auth"

export async function POST(request) {
  const user = await authenticateUser(request)
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  // Use user.id for all database operations
}
```

## ⚠️ **Common Mistakes to Avoid**

### ❌ **DON'T DO THIS**

```javascript
// DON'T store multiple fields in JWT
const payload = {
  id: user.id,
  email: user.email,      // ❌ Remove
  username: user.username // ❌ Remove
}

// DON'T use email/username for database queries after auth
const project = await prisma.project.findFirst({
  where: { owner_email: user.email } // ❌ Use owner_id instead
})

// DON'T verify tokens manually in routes
const token = request.headers.get("authorization")?.slice(7)
const decoded = jwt.verify(token, JWT_SECRET) // ❌ Use authenticateUser()
```

### ✅ **DO THIS INSTEAD**

```javascript
// ✅ Only store userId in JWT
const payload = { userId: user.id }

// ✅ Always use user.id for database queries
const project = await prisma.project.findFirst({
  where: { owner_id: user.id } // ✅ Correct
})

// ✅ Use standardized authentication
const user = await authenticateUser(request) // ✅ Correct
```

## 🔍 **Debugging Authentication Issues**

### **Check Token Payload**

```javascript
import { verifyToken } from "@/lib/auth"

const token = "your-jwt-token"
const payload = verifyToken(token)
console.log(payload) // Should only show: {userId, iat, exp}
```

### **Verify User Lookup**

```javascript
import { authenticateUser } from "@/lib/auth"

const user = await authenticateUser(request)
console.log("Authenticated user:", user?.id) // Should show user UUID
```

### **Check Project Access**

```javascript
import { checkProjectAccess } from "@/lib/auth"

const access = await checkProjectAccess(userId, projectId, "VIEWER")
console.log("Access result:", access) // Shows hasAccess, role, project
```

## 🚀 **Migration Checklist**

When updating existing endpoints to use this standardized system:

1. ✅ Replace manual JWT verification with `authenticateUser()`
2. ✅ Use only `user.id` from authenticated user for database queries
3. ✅ Replace project access checks with `checkProjectAccess()` or `requireProjectAccess()`
4. ✅ Ensure all database foreign keys reference user IDs, not emails/usernames
5. ✅ Update token generation to use only `user.id`
6. ✅ Remove any hardcoded token verification logic

## 📋 **File Structure**

```text
lib/
  auth.js           ← REFERENCE POINT (authentication logic)
middleware/
  auth.js           ← Middleware functions (uses lib/auth.js)
app/api/auth/
  login/route.js    ← Uses lib/auth.js functions
  logout/route.js   ← Uses middleware/auth.js
  reset-password/   ← Uses lib/auth.js functions
app/api/gtfs/
  upload/route.js   ← Uses lib/auth.js functions
```

This standardized approach ensures:

- 🔒 **Secure**: Only user IDs in tokens, fresh data from DB
- 🎯 **Consistent**: Same authentication logic everywhere
- 🐛 **Debuggable**: Single source of truth for auth issues
- 🚀 **Maintainable**: Easy to update authentication logic
