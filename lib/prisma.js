// lib/prisma.js
import { PrismaClient } from "@/prisma/generated/client"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined")
}

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
