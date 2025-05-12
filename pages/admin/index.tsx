"use client"

import { useEffect, useState } from "react"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import { Users, MessageSquare, Activity, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader } from "@/components/ui/loader"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import AdminLogin from "@/components/admin/admin-login"

export default function AdminDashboard() {
  const { admin, token, isAdmin } = useAdminAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalEvents: 0,
    totalAds: 0,
    activeUsers: 0,
    premiumUsers: 0,
    reportedContent: 0,
    newUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // This would be a real API call in a production app
        // For now, we'll simulate some data

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setStats({
          totalUsers: 1250,
          totalPosts: 5432,
          totalEvents: 32,
          totalAds: 18,
          activeUsers: 876,
          premiumUsers: 243,
          reportedContent: 14,
          newUsers: 57,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchStats()
    }
  }, [token])

  if (!isAdmin) {
    return <AdminLogin />
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar />

      <div className="flex-1">
        <AdminHeader title="Dashboard" description="Overview of your platform" />

        <main className="p-6">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <Loader size="lg" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+{stats.newUsers} new users this week</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.premiumUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((stats.premiumUsers / stats.totalUsers) * 100)}% of total users
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(stats.totalPosts / stats.totalUsers)} avg per user
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reported Content</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.reportedContent}</div>
                    <p className="text-xs text-muted-foreground">Needs moderation</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle>Events</CardTitle>
                        <CardDescription>Admin-created events</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalEvents}</div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-sm">24 Upcoming events</span>
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                            <span className="text-sm">8 Active events</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Advertisements</CardTitle>
                        <CardDescription>Currently running ads</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAds}</div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-sm">12 Active campaigns</span>
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
                            <span className="text-sm">6 Pending approval</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>User Activity</CardTitle>
                        <CardDescription>Active users by time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stats.activeUsers}</div>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-sm">432 Daily active users</span>
                          </div>
                          <div className="flex items-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                            <span className="text-sm">876 Weekly active users</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Latest actions on the platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="mr-4 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            U
                          </div>
                          <div>
                            <p className="text-sm font-medium">New user registered</p>
                            <p className="text-xs text-muted-foreground">2 minutes ago</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            P
                          </div>
                          <div>
                            <p className="text-sm font-medium">New post created</p>
                            <p className="text-xs text-muted-foreground">15 minutes ago</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            E
                          </div>
                          <div>
                            <p className="text-sm font-medium">New event created</p>
                            <p className="text-xs text-muted-foreground">1 hour ago</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="mr-4 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            A
                          </div>
                          <div>
                            <p className="text-sm font-medium">New ad campaign started</p>
                            <p className="text-xs text-muted-foreground">3 hours ago</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analytics" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Analytics Dashboard</CardTitle>
                      <CardDescription>Detailed platform analytics will be displayed here</CardDescription>
                    </CardHeader>
                    <CardContent className="h-96 flex items-center justify-center">
                      <p className="text-muted-foreground">Analytics visualization will be implemented here</p>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reports" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Reports</CardTitle>
                      <CardDescription>Detailed system reports will be displayed here</CardDescription>
                    </CardHeader>
                    <CardContent className="h-96 flex items-center justify-center">
                      <p className="text-muted-foreground">Reports will be implemented here</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
