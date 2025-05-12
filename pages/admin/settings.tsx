"use client"

import { Checkbox } from "@/components/ui/checkbox"

import { useState, useEffect } from "react"
import { Save, Shield, Globe, Bell, Users, RefreshCw, Trash2, AlertTriangle } from "lucide-react"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import AdminLayout from "@/layouts/admin-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Loader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"

export default function AdminSettings() {
  const { isAuthenticated, isAdmin, hasPermission } = useAdminAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Site settings
  const [siteName, setSiteName] = useState("NexusSphere")
  const [siteDescription, setSiteDescription] = useState("A next-generation social platform for the future")
  const [logo, setLogo] = useState("/logo.png")
  const [favicon, setFavicon] = useState("/favicon.ico")
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState(true)

  // Security settings
  const [twoFactorEnforced, setTwoFactorEnforced] = useState(false)
  const [passwordMinLength, setPasswordMinLength] = useState(8)
  const [passwordRequireSpecial, setPasswordRequireSpecial] = useState(true)
  const [passwordRequireNumbers, setPasswordRequireNumbers] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState(60)
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5)

  // Content settings
  const [postMaxLength, setPostMaxLength] = useState(500)
  const [commentMaxLength, setCommentMaxLength] = useState(300)
  const [allowedMediaTypes, setAllowedMediaTypes] = useState("image, video, audio")
  const [maxMediaSize, setMaxMediaSize] = useState(10)
  const [badWords, setBadWords] = useState("badword1, badword2, badword3")
  const [autoModerationEnabled, setAutoModerationEnabled] = useState(true)

  // Notification settings
  const [adminEmailNotifications, setAdminEmailNotifications] = useState(true)
  const [newUserNotification, setNewUserNotification] = useState(true)
  const [reportNotification, setReportNotification] = useState(true)
  const [contentRemovalNotification, setContentRemovalNotification] = useState(true)

  useEffect(() => {
    // Simulate loading settings
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleSaveSettings = async (category: string) => {
    setSaving(true)

    // Simulate saving settings
    setTimeout(() => {
      setSaving(false)
      toast({
        title: "Settings Saved",
        description: `${category} settings have been successfully updated.`,
      })
    }, 1500)
  }

  const handleCacheReset = () => {
    toast({
      title: "Cache Reset",
      description: "System cache has been successfully cleared.",
    })
  }

  const handleMaintenanceModeToggle = () => {
    const newMode = !maintenanceMode
    setMaintenanceMode(newMode)

    toast({
      title: newMode ? "Maintenance Mode Activated" : "Maintenance Mode Deactivated",
      description: newMode
        ? "The site is now in maintenance mode. Only admins can access it."
        : "The site is now accessible to all users.",
      variant: newMode ? "destructive" : "default",
    })
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <p className="text-lg">You do not have permission to access this page.</p>
        </div>
      </AdminLayout>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
          <Loader size="lg" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure platform settings and preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid grid-cols-4 md:w-auto">
            <TabsTrigger value="general" className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Manage your site's basic information and configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="site-name">Site Name</Label>
                      <Input id="site-name" value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="site-url">Site URL</Label>
                      <Input id="site-url" value="https://nexussphere.vercel.app" disabled />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site-description">Site Description</Label>
                    <Textarea
                      id="site-description"
                      value={siteDescription}
                      onChange={(e) => setSiteDescription(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="logo">Logo URL</Label>
                      <Input id="logo" value={logo} onChange={(e) => setLogo(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favicon">Favicon URL</Label>
                      <Input id="favicon" value={favicon} onChange={(e) => setFavicon(e.target.value)} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Site Status</h3>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, the site will be inaccessible to regular users
                      </p>
                    </div>
                    <Switch checked={maintenanceMode} onCheckedChange={handleMaintenanceModeToggle} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">User Registration</Label>
                      <p className="text-sm text-muted-foreground">Allow new users to register on the platform</p>
                    </div>
                    <Switch checked={registrationEnabled} onCheckedChange={setRegistrationEnabled} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Cache Management</Label>
                      <p className="text-sm text-muted-foreground">Clear system cache to refresh content</p>
                    </div>
                    <Button variant="outline" onClick={handleCacheReset}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Clear Cache
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleSaveSettings("General")} disabled={saving} className="ml-auto">
                  {saving ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security options for your platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Authentication</h3>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Require two-factor authentication for all users</p>
                    </div>
                    <Switch checked={twoFactorEnforced} onCheckedChange={setTwoFactorEnforced} />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password-min-length">Password Minimum Length</Label>
                      <Input
                        id="password-min-length"
                        type="number"
                        value={passwordMinLength}
                        onChange={(e) => setPasswordMinLength(Number.parseInt(e.target.value))}
                        min={6}
                        max={24}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                      <Input
                        id="max-login-attempts"
                        type="number"
                        value={maxLoginAttempts}
                        onChange={(e) => setMaxLoginAttempts(Number.parseInt(e.target.value))}
                        min={3}
                        max={10}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="require-special"
                        checked={passwordRequireSpecial}
                        onCheckedChange={(checked) => setPasswordRequireSpecial(checked === true)}
                      />
                      <label
                        htmlFor="require-special"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Require special characters
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="require-numbers"
                        checked={passwordRequireNumbers}
                        onCheckedChange={(checked) => setPasswordRequireNumbers(checked === true)}
                      />
                      <label
                        htmlFor="require-numbers"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Require numbers
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Session Management</h3>

                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(Number.parseInt(e.target.value))}
                      min={10}
                      max={1440}
                    />
                    <p className="text-sm text-muted-foreground">How long before an inactive user is logged out</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Danger Zone</h3>

                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <AlertTriangle className="mr-2 h-4 w-4 text-red-600" />
                          <Label className="text-base text-red-600">Reset All Security Settings</Label>
                        </div>
                        <p className="text-sm text-red-600/80">
                          This will reset all security settings to their defaults
                        </p>
                      </div>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleSaveSettings("Security")} disabled={saving} className="ml-auto">
                  {saving ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Content Settings */}
          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Settings</CardTitle>
                <CardDescription>Configure content-related options and moderation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Content Limits</h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="post-max-length">Post Maximum Length</Label>
                      <Input
                        id="post-max-length"
                        type="number"
                        value={postMaxLength}
                        onChange={(e) => setPostMaxLength(Number.parseInt(e.target.value))}
                        min={100}
                        max={2000}
                      />
                      <p className="text-xs text-muted-foreground">Maximum number of characters allowed in posts</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comment-max-length">Comment Maximum Length</Label>
                      <Input
                        id="comment-max-length"
                        type="number"
                        value={commentMaxLength}
                        onChange={(e) => setCommentMaxLength(Number.parseInt(e.target.value))}
                        min={50}
                        max={1000}
                      />
                      <p className="text-xs text-muted-foreground">Maximum number of characters allowed in comments</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="allowed-media-types">Allowed Media Types</Label>
                      <Input
                        id="allowed-media-types"
                        value={allowedMediaTypes}
                        onChange={(e) => setAllowedMediaTypes(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Comma-separated list of allowed media types</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-media-size">Maximum Media Size (MB)</Label>
                      <Input
                        id="max-media-size"
                        type="number"
                        value={maxMediaSize}
                        onChange={(e) => setMaxMediaSize(Number.parseInt(e.target.value))}
                        min={1}
                        max={50}
                      />
                      <p className="text-xs text-muted-foreground">Maximum file size for uploaded media in MB</p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Content Moderation</h3>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Automatic Moderation</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically filter content based on rules and banned words
                      </p>
                    </div>
                    <Switch checked={autoModerationEnabled} onCheckedChange={setAutoModerationEnabled} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bad-words">Banned Words</Label>
                    <Textarea
                      id="bad-words"
                      value={badWords}
                      onChange={(e) => setBadWords(e.target.value)}
                      rows={3}
                      placeholder="Enter comma-separated list of words to ban"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of words to be filtered from user content
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Require Approval for Posts</Label>
                      <p className="text-sm text-muted-foreground">
                        New posts require administrator approval before becoming visible
                      </p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleSaveSettings("Content")} disabled={saving} className="ml-auto">
                  {saving ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure system and admin notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Admin Email Notifications</h3>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Enable Admin Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send email notifications to administrators for important events
                      </p>
                    </div>
                    <Switch checked={adminEmailNotifications} onCheckedChange={setAdminEmailNotifications} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">New User Registration</Label>
                      <p className="text-sm text-muted-foreground">Notify admins when a new user registers</p>
                    </div>
                    <Switch
                      checked={newUserNotification}
                      onCheckedChange={setNewUserNotification}
                      disabled={!adminEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Content Reports</Label>
                      <p className="text-sm text-muted-foreground">Notify admins when content is reported</p>
                    </div>
                    <Switch
                      checked={reportNotification}
                      onCheckedChange={setReportNotification}
                      disabled={!adminEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Content Removal</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify admins when content is automatically removed
                      </p>
                    </div>
                    <Switch
                      checked={contentRemovalNotification}
                      onCheckedChange={setContentRemovalNotification}
                      disabled={!adminEmailNotifications}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Notification Recipients</h3>

                  <div className="space-y-2">
                    <Label htmlFor="admin-emails">Admin Email Addresses</Label>
                    <Textarea
                      id="admin-emails"
                      rows={3}
                      placeholder="Enter comma-separated email addresses"
                      defaultValue="admin@nexussphere.com, support@nexussphere.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of admin email addresses to receive notifications
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => handleSaveSettings("Notification")} disabled={saving} className="ml-auto">
                  {saving ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
