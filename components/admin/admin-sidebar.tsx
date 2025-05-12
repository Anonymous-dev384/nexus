"use client"

import { useRouter } from "next/router"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import { LayoutDashboard, Users, Calendar, ImageIcon, Shield, MessageSquare, AlertTriangle } from "lucide-react"

export default function AdminSidebar() {
  const router = useRouter()
  const { admin, logout, hasPermission } = useAdminAuth()

  const isOwner = admin?.role === "owner"
  const isSuperAdmin = admin?.role === "super_admin"

  const handleLogout = () => {
    logout()
    router.push("/admin/login")
  }

  const menuItems = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/admin",
      showFor: () => true,
    },
    {
      title: "Users",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/users",
      showFor: () => hasPermission("manageUsers"),
    },
    {
      title: "Content",
      icon: <MessageSquare className="h-5 w-5" />,
      href: "/admin/content",
      showFor: () => hasPermission("manageContent"),
    },
    {
      title: "Events",
      icon: <Calendar className="h-5 w-5" />,
      href: "/admin/events",
      showFor: () => hasPermission("manageEvents"),
    },
    {
      title: "Advertisements",
      icon: <ImageIcon className="h-5 w-5" />,
      href: "/admin/ads",
      showFor: () => hasPermission("manageAds"),
    },
    {
      title: "Moderation",
      icon: <Shield className="h-5 w-5" />,
      href: "/admin/moderation",
      showFor: () => hasPermission("manageContent"),
    },
    {
      title: "Reports",
      icon: <AlertTriangle className="h-5 w-5" />,
      href: "/admin/reports",
      showFor: () => hasPermission("manageContent") || hasPermission("manageUsers"),
    },
    {\
      title: "Analytics
