"use client"

import { useState, useEffect } from "react"
import { MessageSquare, MoreHorizontal, CheckCircle, XCircle, Filter, Eye, Edit, Trash2 } from "lucide-react"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import AdminLayout from "@/layouts/admin-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Loader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"

// Mock data - In a real application, this would come from an API
const mockPosts = Array.from({ length: 35 }).map((_, i) => ({
  id: `post-${i + 1}`,
  title: `Post Title ${i + 1}`,
  authorId: `user-${Math.floor(Math.random() * 10) + 1}`,
  authorName: `User ${Math.floor(Math.random() * 10) + 1}`,
  authorUsername: `user${Math.floor(Math.random() * 10) + 1}`,
  content: `This is the content of post ${i + 1}. It might contain text, images, videos, or other media.`,
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
  likeCount: Math.floor(Math.random() * 100),
  commentCount: Math.floor(Math.random() * 20),
  status: ["published", "flagged", "removed"][Math.floor(Math.random() * 3)],
  reportCount: Math.floor(Math.random() * 5),
}))

const mockComments = Array.from({ length: 50 }).map((_, i) => ({
  id: `comment-${i + 1}`,
  postId: `post-${Math.floor(Math.random() * 35) + 1}`,
  authorId: `user-${Math.floor(Math.random() * 10) + 1}`,
  authorName: `User ${Math.floor(Math.random() * 10) + 1}`,
  authorUsername: `user${Math.floor(Math.random() * 10) + 1}`,
  content: `This is comment ${i + 1}. It might be a reply to the post or another comment.`,
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
  likeCount: Math.floor(Math.random() * 20),
  status: ["published", "flagged", "removed"][Math.floor(Math.random() * 3)],
  reportCount: Math.floor(Math.random() * 3),
}))

export default function AdminContent() {
  const { isAuthenticated, isAdmin, hasPermission } = useAdminAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("posts")
  const [loading, setLoading] = useState(true)
  const [postsData, setPostsData] = useState(mockPosts)
  const [commentsData, setCommentsData] = useState(mockComments)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const filterPosts = () => {
    let filtered = [...mockPosts]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.authorName.toLowerCase().includes(query) ||
          post.authorUsername.toLowerCase().includes(query) ||
          post.content.toLowerCase().includes(query),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((post) => post.status === statusFilter)
    }

    return filtered
  }

  const filterComments = () => {
    let filtered = [...mockComments]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (comment) =>
          comment.content.toLowerCase().includes(query) ||
          comment.authorName.toLowerCase().includes(query) ||
          comment.authorUsername.toLowerCase().includes(query),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((comment) => comment.status === statusFilter)
    }

    return filtered
  }

  const handleSelectItem = (id: string) => {
    setSelectedItems((prevSelected) =>
      prevSelected.includes(id) ? prevSelected.filter((item) => item !== id) : [...prevSelected, id],
    )
  }

  const handleSelectAll = (items: any[]) => {
    const currentPageItemIds = items.map((item) => item.id)

    if (selectedItems.length === currentPageItemIds.length) {
      // If all items on the current page are selected, deselect them
      setSelectedItems([])
    } else {
      // Otherwise, select all items on the current page
      setSelectedItems(currentPageItemIds)
    }
  }

  const handleViewItem = (id: string, type: "post" | "comment") => {
    toast({
      title: "View Content",
      description: `Viewing ${type} ${id}`,
    })
  }

  const handleEditItem = (id: string, type: "post" | "comment") => {
    toast({
      title: "Edit Content",
      description: `Editing ${type} ${id}`,
    })
  }

  const handleRemoveItem = (id: string, type: "post" | "comment") => {
    if (window.confirm(`Are you sure you want to remove this ${type}? This action cannot be undone.`)) {
      toast({
        title: "Remove Content",
        description: `Removed ${type} ${id}`,
      })

      if (type === "post") {
        setPostsData((prevPosts) => prevPosts.filter((post) => post.id !== id))
      } else {
        setCommentsData((prevComments) => prevComments.filter((comment) => comment.id !== id))
      }

      setSelectedItems((prevSelected) => prevSelected.filter((item) => item !== id))
    }
  }

  const handleBulkAction = (action: "approve" | "remove") => {
    if (selectedItems.length === 0) return

    if (action === "approve") {
      toast({
        title: "Approve Content",
        description: `Approved ${selectedItems.length} items`,
      })
      // In a real application, you would make an API call to approve the selected items
    } else if (action === "remove") {
      if (
        window.confirm(`Are you sure you want to remove ${selectedItems.length} items? This action cannot be undone.`)
      ) {
        toast({
          title: "Remove Content",
          description: `Removed ${selectedItems.length} items`,
        })

        if (activeTab === "posts") {
          setPostsData((prevPosts) => prevPosts.filter((post) => !selectedItems.includes(post.id)))
        } else {
          setCommentsData((prevComments) => prevComments.filter((comment) => !selectedItems.includes(comment.id)))
        }

        setSelectedItems([])
      }
    }
  }

  const paginateData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const filteredPosts = filterPosts()
  const filteredComments = filterComments()
  const paginatedPosts = paginateData(filteredPosts)
  const paginatedComments = paginateData(filteredComments)
  const totalPages = Math.ceil((activeTab === "posts" ? filteredPosts.length : filteredComments.length) / itemsPerPage)

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Content Management</h1>
            <p className="text-muted-foreground">Manage posts, comments, and reported content</p>
          </div>
        </div>

        <Tabs defaultValue="posts" className="space-y-4" onValueChange={setActiveTab}>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <TabsList>
              <TabsTrigger value="posts" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                Posts
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                Comments
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-60"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter(statusFilter === "all" ? "flagged" : "all")}
              >
                <Filter className="mr-2 h-4 w-4" />
                {statusFilter === "all" ? "Show Flagged" : "Show All"}
              </Button>
            </div>
          </div>

          <TabsContent value="posts" className="space-y-4">
            <Card>
              {selectedItems.length > 0 && (
                <div className="flex items-center justify-between bg-muted p-4">
                  <span>{selectedItems.length} item(s) selected</span>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction("approve")}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleBulkAction("remove")}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={paginatedPosts.length > 0 && selectedItems.length === paginatedPosts.length}
                        onCheckedChange={() => handleSelectAll(paginatedPosts)}
                      />
                    </TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPosts.length > 0 ? (
                    paginatedPosts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(post.id)}
                            onCheckedChange={() => handleSelectItem(post.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{post.title}</span>
                            <span className="truncate text-sm text-muted-foreground max-w-xs">{post.content}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{post.authorName}</span>
                            <span className="text-sm text-muted-foreground">@{post.authorUsername}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{post.likeCount} likes</span>
                            <span>{post.commentCount} comments</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {post.status === "published" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              Published
                            </Badge>
                          ) : post.status === "flagged" ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                              Flagged ({post.reportCount})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                              Removed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewItem(post.id, "post")}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditItem(post.id, "post")}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemoveItem(post.id, "post")}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-center">
                          <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
                          <span className="text-muted-foreground">No posts found</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {filteredPosts.length > itemsPerPage && (
                <div className="p-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1}>
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <Card>
              {selectedItems.length > 0 && (
                <div className="flex items-center justify-between bg-muted p-4">
                  <span>{selectedItems.length} item(s) selected</span>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleBulkAction("approve")}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleBulkAction("remove")}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={paginatedComments.length > 0 && selectedItems.length === paginatedComments.length}
                        onCheckedChange={() => handleSelectAll(paginatedComments)}
                      />
                    </TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedComments.length > 0 ? (
                    paginatedComments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedItems.includes(comment.id)}
                            onCheckedChange={() => handleSelectItem(comment.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="truncate max-w-xs">{comment.content}</span>
                            <span className="text-xs text-muted-foreground">
                              Post: {comment.postId} • {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{comment.authorName}</span>
                            <span className="text-sm text-muted-foreground">@{comment.authorUsername}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{comment.likeCount} likes</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {comment.status === "published" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              Published
                            </Badge>
                          ) : comment.status === "flagged" ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                              Flagged ({comment.reportCount})
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                              Removed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewItem(comment.id, "comment")}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditItem(comment.id, "comment")}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemoveItem(comment.id, "comment")}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-center">
                          <MessageSquare className="h-10 w-10 text-muted-foreground mb-4" />
                          <span className="text-muted-foreground">No comments found</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {filteredComments.length > itemsPerPage && (
                <div className="p-4 border-t">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1}>
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
