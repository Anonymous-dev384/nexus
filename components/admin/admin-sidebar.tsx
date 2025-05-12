"use client"

import { useRouter } from "next/router"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import {
  LayoutDashboard,
  Users,
  Calendar,
  ImageIcon,
  Shield,
  MessageSquare,
  AlertTriangle,
  BarChart,
  Settings,
  Crown,
  Lightbulb,
  LogOut,
} from "lucide-react"

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
    {
      title: "Analytics",
      icon: <BarChart className="h-5 w-5" />,
      href: "/admin/analytics",
      showFor: () => hasPermission("viewAnalytics"),
    },
    {
      title: "Premium",
      icon: <Crown className="h-5 w-5" />,
      href: "/admin/premium",
      showFor: () => hasPermission("managePremium"),
    },
    {
      title: "Suggestions",
      icon: <Lightbulb className="h-5 w-5" />,
      href: "/admin/suggestions",
      showFor: () => hasPermission("viewSuggestions"),
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/admin/settings",
      showFor: () => isOwner || isSuperAdmin,
    },
  ]

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            // Only show menu items based on admin role
            if (!admin || !item.showFor()) {
              return null
            }

            const isActive = router.pathname === item.href

            return (
              <a
                key={item.title}
                href={item.href}
                className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.title}
              </a>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
              {admin?.name?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">{admin?.name || "Admin"}</p>
            <p className="text-xs text-gray-400">{admin?.role || "Not logged in"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-4 flex w-full items-center rounded-lg px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  )
}
