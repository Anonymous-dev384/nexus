"use client"

import { useState, useEffect } from "react"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import axios from "axios"
import { format } from "date-fns"
import {
  DollarSign,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash,
  Eye,
  CheckCircle,
  XCircle,
  BarChart,
} from "lucide-react"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import AdminLogin from "@/components/admin/admin-login"
import CreateAdModal from "@/components/admin/create-ad-modal"

interface Ad {
  id: string
  title: string
  description: string
  imageUrl: string
  targetUrl: string
  advertiser: string
  placement: "feed" | "sidebar" | "profile" | "explore"
  status: "pending" | "active" | "rejected" | "completed"
  startDate: string
  endDate: string
  budget: number
  impressions: number
  clicks: number
  createdAt: string
}

export default function AdminAdsPage() {
  const { isAdmin, hasPermission } = useAdminAuth()
  const { toast } = useToast()

  const [ads, setAds] = useState<Ad[]>([])
  const [filteredAds, setFilteredAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    if (isAdmin && hasPermission("manageAds")) {
      fetchAds()
    }
  }, [isAdmin])

  useEffect(() => {
    filterAds()
  }, [ads, activeTab, searchQuery])

  const fetchAds = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/admin/ads")
      setAds(response.data)
    } catch (error) {
      console.error("Error fetching ads:", error)
      toast({
        title: "Error",
        description: "Failed to load advertisements",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAds = () => {
    let filtered = [...ads]

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((ad) => ad.status === activeTab)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (ad) =>
          ad.title.toLowerCase().includes(query) ||
          ad.description.toLowerCase().includes(query) ||
          ad.advertiser.toLowerCase().includes(query),
      )
    }

    setFilteredAds(filtered)
  }

  const handleUpdateAdStatus = async (adId: string, status: "active" | "rejected" | "completed") => {
    try {
      await axios.patch(`/api/admin/ads/${adId}/status`, { status })

      // Update local state
      setAds((prevAds) => prevAds.map((ad) => (ad.id === adId ? { ...ad, status } : ad)))

      toast({
        title: "Status updated",
        description: `Ad status updated to ${status}`,
      })
    } catch (error) {
      console.error("Error updating ad status:", error)
      toast({
        title: "Error",
        description: "Failed to update ad status",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAd = async (adId: string) => {
    try {
      await axios.delete(`/api/admin/ads/${adId}`)

      // Update local state
      setAds((prevAds) => prevAds.filter((ad) => ad.id !== adId))

      toast({
        title: "Ad deleted",
        description: "The advertisement has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting ad:", error)
      toast({
        title: "Error",
        description: "Failed to delete advertisement",
        variant: "destructive",
      })
    }
  }

  if (!isAdmin) {
    return <AdminLogin />
  }

  if (!hasPermission("manageAds")) {
    return (
      <div className="flex min-h-screen bg-muted/20">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to manage advertisements</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar />

      <div className="flex-1">
        <AdminHeader title="Advertisements Management" description="Create and manage platform ads" />

        <main className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Ads</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search ads..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Ad
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : filteredAds.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad</TableHead>
                    <TableHead>Placement</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAds.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded overflow-hidden bg-muted">
                            <img
                              src={ad.imageUrl || "/placeholder.svg"}
                              alt={ad.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-medium">{ad.title}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{ad.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ad.placement.charAt(0).toUpperCase() + ad.placement.slice(1)}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ad.startDate), "MMM d")} - {format(new Date(ad.endDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>${ad.budget.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{ad.impressions.toLocaleString()} views</span>
                          <span className="text-xs text-muted-foreground mx-1">•</span>
                          <span className="text-xs">{ad.clicks.toLocaleString()} clicks</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ad.clicks > 0 && ad.impressions > 0
                            ? `${((ad.clicks / ad.impressions) * 100).toFixed(2)}% CTR`
                            : "No data"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {ad.status === "active" && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
                            Active
                          </Badge>
                        )}
                        {ad.status === "pending" && (
                          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-200">
                            Pending
                          </Badge>
                        )}
                        {ad.status === "rejected" && (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-200">
                            Rejected
                          </Badge>
                        )}
                        {ad.status === "completed" && (
                          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-200">
                            Completed
                          </Badge>
                        )}
                      </TableCell>
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
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Ad
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart className="h-4 w-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {ad.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateAdStatus(ad.id, "active")}>
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                  Approve Ad
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateAdStatus(ad.id, "rejected")}>
                                  <XCircle className="h-4 w-4 mr-2 text-red-500" />
                                  Reject Ad
                                </DropdownMenuItem>
                              </>
                            )}
                            {ad.status === "active" && (
                              <DropdownMenuItem onClick={() => handleUpdateAdStatus(ad.id, "completed")}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteAd(ad.id)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete Ad
                            </DropdownMenuItem>
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
                <DollarSign className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">No advertisements found</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {searchQuery
                  ? "No ads match your search criteria. Try a different search term."
                  : "There are no ads in this category. Create one to get started!"}
              </p>
              <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Ad
              </Button>
            </div>
          )}
        </main>
      </div>

      <CreateAdModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAdCreated={(newAd) => {
          setAds((prev) => [newAd, ...prev])
          setIsCreateModalOpen(false)
        }}
      />
    </div>
  )
}
