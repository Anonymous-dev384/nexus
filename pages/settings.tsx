"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MainLayout } from "../layouts/main-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "../lib/auth-provider"
import { doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { updateProfile } from "firebase/auth"
import { Loader } from "../components/ui/loader"
import { useToast } from "@/components/ui/use-toast"
import {
  User,
  Bell,
  Shield,
  Palette,
  SettingsIcon,
  Camera,
  Lock,
  Globe,
  Users,
  Sun,
  Moon,
  Laptop,
  Download,
} from "lucide-react"

export default function Settings() {
  const { user, signOut } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState<any>({
    displayName: "",
    username: "",
    bio: "",
    email: "",
    profileImageUrl: "",
    bannerImageUrl: "",
    notificationPreferences: {
      email: true,
      push: true,
      mentions: true,
      messages: true,
      newFollowers: true,
    },
    privacySettings: {
      profileVisibility: "public",
      messagePermissions: "followers",
      activityVisibility: true,
      dataSharing: false,
    },
    appearanceSettings: {
      theme: "system",
      fontSize: "medium",
      reducedMotion: false,
      highContrast: false,
    },
  })

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          setUserData({
            displayName: user.displayName || "",
            email: user.email || "",
            profileImageUrl: user.photoURL || "",
            ...data,
          })
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleToggleChange = (section: string, setting: string, value: boolean) => {
    setUserData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [setting]: value,
      },
    }))
  }

  const handleSelectChange = (section: string, setting: string, value: string) => {
    setUserData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [setting]: value,
      },
    }))
  }

  const saveProfile = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: userData.displayName,
        photoURL: userData.profileImageUrl,
      })

      // Update Firestore document
      await updateDoc(doc(db, "users", user.uid), {
        username: userData.username,
        bio: userData.bio,
        bannerImageUrl: userData.bannerImageUrl,
        notificationPreferences: userData.notificationPreferences,
        privacySettings: userData.privacySettings,
        appearanceSettings: userData.appearanceSettings,
        updatedAt: new Date(),
      })

      toast({
        title: "Settings saved",
        description: "Your profile settings have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[70vh]">
          <Loader size="large" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile information visible to other users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="relative">
                    <div className="h-32 w-full bg-gradient-to-r from-blue-400 to-purple-600 rounded-t-lg overflow-hidden">
                      {userData.bannerImageUrl && (
                        <img
                          src={userData.bannerImageUrl || "/placeholder.svg"}
                          alt="Profile banner"
                          className="w-full h-full object-cover"
                        />
                      )}
                      <Button size="sm" variant="secondary" className="absolute right-2 top-2">
                        <Camera className="h-4 w-4 mr-2" />
                        Change Banner
                      </Button>
                    </div>
                    <div className="absolute -bottom-12 left-4">
                      <Avatar className="h-24 w-24 border-4 border-background">
                        <AvatarImage src={userData.profileImageUrl || "/placeholder.svg"} />
                        <AvatarFallback>{userData.displayName?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="pt-14 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          name="displayName"
                          value={userData.displayName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" name="username" value={userData.username} onChange={handleInputChange} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" name="bio" value={userData.bio} onChange={handleInputChange} rows={4} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" value={userData.email} onChange={handleInputChange} disabled />
                      <p className="text-sm text-muted-foreground">
                        Your email is used for account purposes and is not visible to others.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving ? <Loader size="small" className="mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={userData.notificationPreferences.email}
                      onCheckedChange={(checked) => handleToggleChange("notificationPreferences", "email", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Push Notifications</h3>
                      <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
                    </div>
                    <Switch
                      checked={userData.notificationPreferences.push}
                      onCheckedChange={(checked) => handleToggleChange("notificationPreferences", "push", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Mentions</h3>
                      <p className="text-sm text-muted-foreground">When someone mentions you in a post</p>
                    </div>
                    <Switch
                      checked={userData.notificationPreferences.mentions}
                      onCheckedChange={(checked) => handleToggleChange("notificationPreferences", "mentions", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Direct Messages</h3>
                      <p className="text-sm text-muted-foreground">When you receive a new message</p>
                    </div>
                    <Switch
                      checked={userData.notificationPreferences.messages}
                      onCheckedChange={(checked) => handleToggleChange("notificationPreferences", "messages", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">New Followers</h3>
                      <p className="text-sm text-muted-foreground">When someone follows your account</p>
                    </div>
                    <Switch
                      checked={userData.notificationPreferences.newFollowers}
                      onCheckedChange={(checked) =>
                        handleToggleChange("notificationPreferences", "newFollowers", checked)
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving ? <Loader size="small" className="mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your privacy and security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Profile Visibility</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        variant={userData.privacySettings.profileVisibility === "public" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSelectChange("privacySettings", "profileVisibility", "public")}
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Public
                      </Button>
                      <Button
                        variant={userData.privacySettings.profileVisibility === "followers" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSelectChange("privacySettings", "profileVisibility", "followers")}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Followers Only
                      </Button>
                      <Button
                        variant={userData.privacySettings.profileVisibility === "private" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSelectChange("privacySettings", "profileVisibility", "private")}
                      >
                        <Lock className="h-4 w-4 mr-2" />
                        Private
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Message Permissions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant={userData.privacySettings.messagePermissions === "everyone" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSelectChange("privacySettings", "messagePermissions", "everyone")}
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Everyone
                      </Button>
                      <Button
                        variant={userData.privacySettings.messagePermissions === "followers" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSelectChange("privacySettings", "messagePermissions", "followers")}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Followers Only
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Activity Visibility</h3>
                      <p className="text-sm text-muted-foreground">Show your online status and activity</p>
                    </div>
                    <Switch
                      checked={userData.privacySettings.activityVisibility}
                      onCheckedChange={(checked) =>
                        handleToggleChange("privacySettings", "activityVisibility", checked)
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Data Sharing</h3>
                      <p className="text-sm text-muted-foreground">Share usage data to improve services</p>
                    </div>
                    <Switch
                      checked={userData.privacySettings.dataSharing}
                      onCheckedChange={(checked) => handleToggleChange("privacySettings", "dataSharing", checked)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving ? <Loader size="small" className="mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize how the application looks and feels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Theme</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        variant={userData.appearanceSettings.theme === "light" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSelectChange("appearanceSettings", "theme", "light")}
                      >
                        <Sun className="h-4 w-4 mr-2" />
                        Light
                      </Button>
                      <Button
                        variant={userData.appearanceSettings.theme === "dark" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSelectChange("appearanceSettings", "theme", "dark")}
                      >
                        <Moon className="h-4 w-4 mr-2" />
                        Dark
                      </Button>
                      <Button
                        variant={userData.appearanceSettings.theme === "system" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSelectChange("appearanceSettings", "theme", "system")}
                      >
                        <Laptop className="h-4 w-4 mr-2" />
                        System
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-2">Font Size</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        variant={userData.appearanceSettings.fontSize === "small" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSelectChange("appearanceSettings", "fontSize", "small")}
                      >
                        Small
                      </Button>
                      <Button
                        variant={userData.appearanceSettings.fontSize === "medium" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSelectChange("appearanceSettings", "fontSize", "medium")}
                      >
                        Medium
                      </Button>
                      <Button
                        variant={userData.appearanceSettings.fontSize === "large" ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => handleSelectChange("appearanceSettings", "fontSize", "large")}
                      >
                        Large
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Reduced Motion</h3>
                      <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                    </div>
                    <Switch
                      checked={userData.appearanceSettings.reducedMotion}
                      onCheckedChange={(checked) => handleToggleChange("appearanceSettings", "reducedMotion", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">High Contrast</h3>
                      <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                    </div>
                    <Switch
                      checked={userData.appearanceSettings.highContrast}
                      onCheckedChange={(checked) => handleToggleChange("appearanceSettings", "highContrast", checked)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={saveProfile} disabled={saving}>
                    {saving ? <Loader size="small" className="mr-2" /> : null}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Change Password</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input id="currentPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input id="newPassword" type="password" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input id="confirmPassword" type="password" />
                      </div>
                      <Button>Update Password</Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-medium">Connected Accounts</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center">
                          <img src="/placeholder.svg?height=24&width=24" alt="Google" className="mr-2" />
                          <span>Google</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          Connect
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center">
                          <img src="/placeholder.svg?height=24&width=24" alt="Discord" className="mr-2" />
                          <span>Discord</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          Connect
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-medium">Data Export</h3>
                    <p className="text-sm text-muted-foreground">Download a copy of your data</p>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h3 className="font-medium text-destructive">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all of your content
                    </p>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
