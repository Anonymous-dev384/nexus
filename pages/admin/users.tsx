"use client"

import { useState, useEffect } from "react"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import { Loader } from "@/components/ui/loader"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { Search, Filter, UserPlus, Shield, Crown, Ban, CheckCircle } from "lucide-react"

export default function AdminUsers() {
  const { admin, hasPermission } = useAdminAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    // Fetch users
    const fetchUsers = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        setTimeout(() => {
          setUsers([
            {
              id: "1",
              username: "user1",
              email: "user1@example.com",
              role: "user",
              status: "active",
              premium: false,
              joinDate: "2023-01-15",
              lastActive: "2023-05-20",
              postCount: 45,
              reportCount: 0,
            },
            {
              id: "2",
              username: "premium_user",
              email: "premium@example.com",
              role: "premium",
              status: "active",
              premium: true,
              joinDate: "2023-02-10",
              lastActive: "2023-05-21",
              postCount: 87,
              reportCount: 0,
            },
            {
              id: "3",
              username: "reported_user",
              email: "reported@example.com",
              role: "user",
              status: "flagged",
              premium: false,
              joinDate: "2023-03-05",
              lastActive: "2023-05-15",
              postCount: 12,
              reportCount: 3,
            },
            {
              id: "4",
              username: "banned_user",
              email: "banned@example.com",
              role: "user",
              status: "banned",
              premium: false,
              joinDate: "2023-01-20",
              lastActive: "2023-04-10",
              postCount: 5,
              reportCount: 7,
            },
            {
              id: "5",
              username: "verified_user",
              email: "verified@example.com",
              role: "verified",
              status: "active",
              premium: true,
              joinDate: "2023-02-25",
              lastActive: "2023-05-22",
              postCount: 156,
              reportCount: 0,
            },
          ])
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching users:", error)
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === "all") return matchesSearch
    if (filter === "premium") return matchesSearch && user.premium
    if (filter === "reported") return matchesSearch && user.reportCount > 0
    if (filter === "banned") return matchesSearch && user.status === "banned"
    if (filter === "verified") return matchesSearch && user.role === "verified"

    return matchesSearch
  })

  const handleBanUser = (userId) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, status: user.status === "banned" ? "active" : "banned" } : user,
      ),
    )
  }

  const handleVerifyUser = (userId) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, role: user.role === "verified" ? "user" : "verified" } : user,
      ),
    )
  }

  const handleMakePremium = (userId) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, premium: !user.premium, role: !user.premium ? "premium" : "user" } : user,
      ),
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <AdminSidebar />
        <div className="flex flex-1 items-center justify-center">
          <Loader size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users, roles, and permissions</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="all">All Users</option>
              <option value="premium">Premium</option>
              <option value="reported">Reported</option>
              <option value="banned">Banned</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          {hasPermission("createUsers") && (
            <button className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700">
              <UserPlus className="h-5 w-5" />
              Add User
            </button>
          )}
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Posts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Reports
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-purple-100 text-center leading-10 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.username}
                          {user.role === "verified" && <span className="ml-1 text-blue-500">✓</span>}
                          {user.premium && <span className="ml-1 text-yellow-500">★</span>}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : user.status === "flagged"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {user.joinDate}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {user.postCount}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {user.reportCount}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      {hasPermission("manageUsers") && (
                        <>
                          <button
                            onClick={() => handleBanUser(user.id)}
                            className={`rounded p-1 ${
                              user.status === "banned"
                                ? "text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900"
                                : "text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
                            }`}
                            title={user.status === "banned" ? "Unban User" : "Ban User"}
                          >
                            {user.status === "banned" ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Ban className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleVerifyUser(user.id)}
                            className={`rounded p-1 ${
                              user.role === "verified"
                                ? "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                : "text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
                            }`}
                            title={user.role === "verified" ? "Remove Verification" : "Verify User"}
                          >
                            <Shield className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleMakePremium(user.id)}
                            className={`rounded p-1 ${
                              user.premium
                                ? "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                                : "text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900"
                            }`}
                            title={user.premium ? "Remove Premium" : "Make Premium"}
                          >
                            <Crown className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
