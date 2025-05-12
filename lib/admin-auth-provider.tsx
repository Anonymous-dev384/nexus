"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AdminPermissions {
  manageUsers: boolean
  manageContent: boolean
  manageEvents: boolean
  manageAds: boolean
  manageAdmins: boolean
  viewAnalytics: boolean
  managePremium: boolean
  fullAccess: boolean
}

interface Admin {
  id: string
  username: string
  name: string
  role: "owner" | "super_admin" | "content_moderator" | "user_moderator" | "event_manager" | "ad_manager"
  permissions: AdminPermissions
}

interface AdminAuthContextType {
  admin: Admin | null
  token: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  isAdmin: boolean
  isOwner: boolean
  isSuperAdmin: boolean
  hasPermission: (permission: string) => boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if admin is already logged in
    const storedAdmin = localStorage.getItem("admin")
    const storedToken = localStorage.getItem("adminToken")

    if (storedAdmin && storedToken) {
      setAdmin(JSON.parse(storedAdmin))
      setToken(storedToken)
    }

    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        setAdmin(data.admin)
        setToken(data.token)

        // Store in localStorage
        localStorage.setItem("admin", JSON.stringify(data.admin))
        localStorage.setItem("adminToken", data.token)

        return true
      }

      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setAdmin(null)
    setToken(null)
    localStorage.removeItem("admin")
    localStorage.removeItem("adminToken")
  }

  const isAdmin = !!admin
  const isOwner = admin?.role === "owner"
  const isSuperAdmin = admin?.role === "super_admin"

  const hasPermission = (permission: string): boolean => {
    if (!admin) return false

    // Owner and super_admin have all permissions
    if (admin.role === "owner" || admin.role === "super_admin") return true

    // Check specific permissions
    switch (permission) {
      case "manageUsers":
        return admin.permissions.manageUsers || admin.permissions.fullAccess
      case "manageContent":
        return admin.permissions.manageContent || admin.permissions.fullAccess
      case "manageEvents":
        return admin.permissions.manageEvents || admin.permissions.fullAccess
      case "manageAds":
        return admin.permissions.manageAds || admin.permissions.fullAccess
      case "manageAdmins":
        return admin.permissions.manageAdmins || admin.permissions.fullAccess
      case "viewAnalytics":
        return admin.permissions.viewAnalytics || admin.permissions.fullAccess
      case "managePremium":
        return admin.permissions.managePremium || admin.permissions.fullAccess
      default:
        return false
    }
  }

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        login,
        logout,
        isLoading,
        isAdmin,
        isOwner,
        isSuperAdmin,
        hasPermission,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)

  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider")
  }

  return context
}
