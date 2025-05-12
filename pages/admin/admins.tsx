"use client"

import { useState, useEffect } from "react"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import axios from "axios"
import { format } from "date-fns"
import { Shield, Plus, Search, MoreHorizontal, Edit, Trash, CheckCircle, XCircle, Key, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import AdminLogin from "@/components/admin/admin-login"
import CreateAdminModal from "@/components/admin/create-admin-modal"

interface Admin {
  id: string
  userId: string
  email: string
  role: "owner" | "super_admin" | "content_moderator" | "user_moderator" | "event_manager" | "ad_manager"
  permissions: {
    manageUsers: boolean
    manageContent: boolean
    manageEvents: boolean
    manageAds: boolean
    manageAdmins: boolean
    viewAnalytics: boolean
    managePremium: boolean
    fullAccess: boolean
  }
  status: "active" | "suspended" | "inactive"
  lastLogin: string
  createdBy: string
  createdAt: string
}

export default function AdminsManagementPage() {
  const { isAdmin, isOwner, isSuperAdmin, admin } = useAdminAuth()
  const { toast } = useToast()

  const [admins, setAdmins] = useState<Admin[]>([])
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newAdminPassword, setNewAdminPassword] = useState<string | null>(null)

  useEffect(() => {
    if (isAdmin && (isOwner || isSuperAdmin)) {
      fetchAdmins()
    }
  }, [isAdmin, isOwner, isSuperAdmin])

  useEffect(() => {
    filterAdmins()
  }, [admins, searchQuery])

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/admin/admins")
      setAdmins(response.data)
    } catch (error) {
      console.error("Error fetching admins:", error)
      toast({
        title: "Error",
        description: "Failed to load admin accounts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAdmins = () => {
    let filtered = [...admins]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (admin) => admin.email.toLowerCase().includes(query) || admin.role.toLowerCase().includes(query),
      )
    }

    setFilteredAdmins(filtered)
  }

  const handleUpdateAdminStatus = async (adminId: string, status: "active" | "suspended" | "inactive") => {
    try {
      await axios.patch(`/api/admin/${adminId}/status`, { status })

      // Update local state
      setAdmins((prevAdmins) => prevAdmins.map((admin) => (admin.id === adminId ? { ...admin, status } : admin)))

      toast({
        title: "Status updated",
        description: `Admin status updated to ${status}`,
      })
    } catch (error) {
      console.error("Error updating admin status:", error)
      toast({
        title: "Error",
        description: "Failed to update admin status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await axios.delete(`/api/admin/${adminId}`)

      // Update local state
      setAdmins((prevAdmins) => prevAdmins.filter((admin) => admin.id !== adminId))

      toast({
        title: "Admin deleted",
        description: "The admin account has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting admin:", error)
      toast({
        title: "Error",
        description: "Failed to delete admin account",
        variant: "destructive",
      })
    }
  }

  const handleCopyPassword = (password: string) => {
    navigator.clipboard.writeText(password)
    toast({
      title: "Password copied",
      description: "Admin password copied to clipboard",
    })
  }

  if (!isAdmin) {
    return <AdminLogin />
  }

  if (!(isOwner || isSuperAdmin)) {
    return (
      <div className="flex min-h-screen bg-muted/20">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to manage admin accounts</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar />

      <div className="flex-1">
        <AdminHeader title="Admin Management" description="Manage admin accounts and permissions" />

        <main className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="relative flex-1 md:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search admins..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Admin
            </Button>
          </div>

          {newAdminPassword && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
              <div className="flex items-start">
                <Key className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                <div className="flex-1">
                  <h3 className="font-medium text-yellow-800">New Admin Password</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please save this password securely. It will only be shown once.
                  </p>
                  <div className="flex items-center mt-2">
                    <code className="bg-white px-2 py-1 rounded border border-yellow-200 text-sm font-mono">
                      {newAdminPassword}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 text-yellow-700"
                      onClick={() => handleCopyPassword(newAdminPassword)}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copy password</span>
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-yellow-700"
                  onClick={() => setNewAdminPassword(null)}
                >
                  <XCircle className="h-4 w-4" />
                  <span className="sr-only">Dismiss</span>
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : filteredAdmins.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((adminUser) => (
                    <TableRow key={adminUser.id}>
                      <TableCell className="font-medium">{adminUser.email}</TableCell>
                      <TableCell>
                        <Badge variant={adminUser.role === "owner" ? "default" : "outline"}>
                          {adminUser.role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {adminUser.permissions.fullAccess && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              Full Access
                            </Badge>
                          )}
                          {!adminUser.permissions.fullAccess && (
                            <>
                              {adminUser.permissions.manageUsers && (
                                <Badge variant="outline" className="text-xs">
                                  Users
                                </Badge>
                              )}
                              {adminUser.permissions.manageContent && (
                                <Badge variant="outline" className="text-xs">
                                  Content
                                </Badge>
                              )}
                              {adminUser.permissions.manageEvents && (
                                <Badge variant="outline" className="text-xs">
                                  Events
                                </Badge>
                              )}
                              {adminUser.permissions.manageAds && (
                                <Badge variant="outline" className="text-xs">
                                  Ads
                                </Badge>
                              )}
                              {adminUser.permissions.manageAdmins && (
                                <Badge variant="outline" className="text-xs">
                                  Admins
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {adminUser.status === "active" && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
                            Active
                          </Badge>
                        )}
                        {adminUser.status === "suspended" && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-200">
                            Suspended
                          </Badge>
                        )}
                        {adminUser.status === "inactive" && (
                          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-200">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {adminUser.lastLogin ? format(new Date(adminUser.lastLogin), "MMM d, yyyy") : "Never"}
                      </TableCell>
                      <TableCell>{format(new Date(adminUser.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Key className="h-4 w-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {adminUser.role !== "owner" && (
                              <>
                                {adminUser.status === "active" ? (
                                  <DropdownMenuItem onClick={() => handleUpdateAdminStatus(adminUser.id, "suspended")}>
                                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                    Suspend Admin
                                  </DropdownMenuItem>
                                ) : (
                                  adminUser.status === "suspended" && (
                                    <DropdownMenuItem onClick={() => handleUpdateAdminStatus(adminUser.id, "active")}>
                                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                      Activate Admin
                                    </DropdownMenuItem>
                                  )
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteAdmin(adminUser.id)}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete Admin
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Shield className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">No admin accounts found</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {searchQuery
                  ? "No admins match your search criteria. Try a different search term."
                  : "There are no admin accounts yet. Create one to get started!"}
              </p>
              <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </div>
          )}
        </main>
      </div>

      <CreateAdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAdminCreated={(newAdmin, password) => {
          setAdmins((prev) => [newAdmin, ...prev])
          setNewAdminPassword(password)
          setIsCreateModalOpen(false)
        }}
      />
    </div>
  )
}
