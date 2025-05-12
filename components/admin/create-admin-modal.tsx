"use client"

import type React from "react"

import { useState } from "react"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import axios from "axios"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

interface CreateAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onAdminCreated: (admin: any, password: string) => void
}

export default function CreateAdminModal({ isOpen, onClose, onAdminCreated }: CreateAdminModalProps) {
  const { admin, token } = useAdminAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    role: "content_moderator",
    permissions: {
      manageUsers: false,
      manageContent: true,
      manageEvents: false,
      manageAds: false,
      manageAdmins: false,
      viewAnalytics: false,
      managePremium: false,
      fullAccess: false,
    },
  })

  const [isLoading, setIsLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    let updatedPermissions = { ...formData.permissions }

    // Set default permissions based on role
    switch (value) {
      case "super_admin":
        updatedPermissions = {
          manageUsers: true,
          manageContent: true,
          manageEvents: true,
          manageAds: true,
          manageAdmins: false, // Only owner can manage admins
          viewAnalytics: true,
          managePremium: true,
          fullAccess: true,
        }
        break
      case "content_moderator":
        updatedPermissions = {
          manageUsers: false,
          manageContent: true,
          manageEvents: false,
          manageAds: false,
          manageAdmins: false,
          viewAnalytics: false,
          managePremium: false,
          fullAccess: false,
        }
        break
      case "user_moderator":
        updatedPermissions = {
          manageUsers: true,
          manageContent: false,
          manageEvents: false,
          manageAds: false,
          manageAdmins: false,
          viewAnalytics: false,
          managePremium: false,
          fullAccess: false,
        }
        break
      case "event_manager":
        updatedPermissions = {
          manageUsers: false,
          manageContent: false,
          manageEvents: true,
          manageAds: false,
          manageAdmins: false,
          viewAnalytics: false,
          managePremium: false,
          fullAccess: false,
        }
        break
      case "ad_manager":
        updatedPermissions = {
          manageUsers: false,
          manageContent: false,
          manageEvents: false,
          manageAds: true,
          manageAdmins: false,
          viewAnalytics: true,
          managePremium: false,
          fullAccess: false,
        }
        break
    }

    setFormData((prev) => ({
      ...prev,
      role: value,
      permissions: updatedPermissions,
    }))
  }

  const handlePermissionChange = (permission: keyof typeof formData.permissions, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked,
      },
    }))
  }

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Generate a random password
      const password = generateRandomPassword()
      setGeneratedPassword(password)

      const response = await axios.post(
        "/api/admin/create",
        {
          ...formData,
          password,
          createdBy: admin?.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Admin created successfully",
        })
        onAdminCreated(response.data.admin, password)
      } else {
        toast({
          title: "Error",
          description: response.data.message || "Failed to create admin",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Create admin error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Admin</DialogTitle>
          <DialogDescription>
            Add a new admin user to the system. They will receive login credentials.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content_moderator">Content Moderator</SelectItem>
                  <SelectItem value="user_moderator">User Moderator</SelectItem>
                  <SelectItem value="event_manager">Event Manager</SelectItem>
                  <SelectItem value="ad_manager">Ad Manager</SelectItem>
                  {admin?.role === "owner" && <SelectItem value="super_admin">Super Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Permissions</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="manageUsers"
                    checked={formData.permissions.manageUsers}
                    onCheckedChange={(checked) => handlePermissionChange("manageUsers", !!checked)}
                  />
                  <Label htmlFor="manageUsers">Manage Users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="manageContent"
                    checked={formData.permissions.manageContent}
                    onCheckedChange={(checked) => handlePermissionChange("manageContent", !!checked)}
                  />
                  <Label htmlFor="manageContent">Manage Content</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="manageEvents"
                    checked={formData.permissions.manageEvents}
                    onCheckedChange={(checked) => handlePermissionChange("manageEvents", !!checked)}
                  />
                  <Label htmlFor="manageEvents">Manage Events</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="manageAds"
                    checked={formData.permissions.manageAds}
                    onCheckedChange={(checked) => handlePermissionChange("manageAds", !!checked)}
                  />
                  <Label htmlFor="manageAds">Manage Advertisements</Label>
                </div>
                {admin?.role === "owner" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="manageAdmins"
                      checked={formData.permissions.manageAdmins}
                      onCheckedChange={(checked) => handlePermissionChange("manageAdmins", !!checked)}
                    />
                    <Label htmlFor="manageAdmins">Manage Admins</Label>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="viewAnalytics"
                    checked={formData.permissions.viewAnalytics}
                    onCheckedChange={(checked) => handlePermissionChange("viewAnalytics", !!checked)}
                  />
                  <Label htmlFor="viewAnalytics">View Analytics</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="managePremium"
                    checked={formData.permissions.managePremium}
                    onCheckedChange={(checked) => handlePermissionChange("managePremium", !!checked)}
                  />
                  <Label htmlFor="managePremium">Manage Premium Features</Label>
                </div>
                {admin?.role === "owner" && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fullAccess"
                      checked={formData.permissions.fullAccess}
                      onCheckedChange={(checked) => handlePermissionChange("fullAccess", !!checked)}
                    />
                    <Label htmlFor="fullAccess">Full Access</Label>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Admin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
