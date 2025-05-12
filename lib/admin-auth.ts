import jwt from "jsonwebtoken"

interface AdminTokenPayload {
  id: string
  username: string
  role: string
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as AdminTokenPayload
    return decoded
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

export function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission) || permissions.includes("all")
}
