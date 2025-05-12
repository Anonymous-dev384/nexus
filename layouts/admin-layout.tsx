"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/router"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import AdminSidebar from "@/components/admin/admin-sidebar"
import AdminHeader from "@/components/admin/admin-header"
import { Loader } from "@/components/ui/loader"

interface AdminLayoutProps {
  children: React.ReactNode
  requireOwner?: boolean
}

export default function AdminLayout({ children, requireOwner = false }: AdminLayoutProps) {
  const { admin, isLoading } = useAdminAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !admin) {
      router.push("/admin/login")
    }

    if (!isLoading && admin && requireOwner && admin.role !== "owner") {
      router.push("/admin")
    }
  }, [admin, isLoading, router, requireOwner])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
