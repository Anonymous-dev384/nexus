"use client"

import { useState, useEffect } from "react"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import { Loader } from "@/components/ui/loader"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { Search, Filter, Trash2, Eye, CheckCircle, Flag } from "lucide-react"

export default function AdminContent() {
  const { admin, hasPermission } = useAdminAuth()
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")
  const [contentType, setContentType] = useState("posts")

  useEffect(() => {
    // Fetch content
    const fetchContent = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        setTimeout(() => {
          if (contentType === "posts") {
            setContent([
              {
                id: "1",
                type: "post",
                title: "First post",
                content: "This is the first post content",
                author: "user1",
                authorId: "1",
                createdAt: "2023-05-15T10:30:00Z",
                status: "active",
                reportCount: 0,
                likes: 24,
                comments: 5,
              },
              {
                id: "2",
                type: "post",
                title: "Reported post",
                content: "This post has been reported multiple times",
                author: "user2",
                authorId: "2",
                createdAt: "2023-05-16T14:20:00Z",
                status: "flagged",
                reportCount: 3,
                likes: 2,
                comments: 12,
              },
              {
                id: "3",
                type: "post",
                title: "Hidden post",
                content: "This post has been hidden by moderators",
                author: "user3",
                authorId: "3",
                createdAt: "2023-05-17T09:15:00Z",
                status: "hidden",
                reportCount: 5,
                likes: 0,
                comments: 0,
              },
            ])
          } else if (contentType === "comments") {
            setContent([
              {
                id: "1",
                type: "comment",
                content: "Great post!",
                author: "user1",
                authorId: "1",
                postId: "1",
                createdAt: "2023-05-15T11:30:00Z",
                status: "active",
                reportCount: 0,
                likes: 5,
              },
              {
                id: "2",
                type: "comment",
                content: "This comment has been reported",
                author: "user2",
                authorId: "2",
                postId: "1",
                createdAt: "2023-05-16T15:20:00Z",
                status: "flagged",
                reportCount: 2,
                likes: 0,
              },
              {
                id: "3",
                type: "comment",
                content: "This comment has been hidden",
                author: "user3",
                authorId: "3",
                postId: "2",
                createdAt: "2023-05-17T10:15:00Z",
                status: "hidden",
                reportCount: 4,
                likes: 0,
              },
            ])
          }
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching content:", error)
        setLoading(false)
      }
    }

    fetchContent()
  }, [contentType])

  const filteredContent = content.filter((item) => {
    const matchesSearch =
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.author.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === "all") return matchesSearch
    if (filter === "reported") return matchesSearch && item.reportCount > 0
    if (filter === "hidden") return matchesSearch && item.status === "hidden"
    if (filter === "flagged") return matchesSearch && item.status === "flagged"

    return matchesSearch
  })

  const handleApproveContent = (contentId) => {
    setContent(content.map((item) => (item.id === contentId ? { ...item, status: "active", reportCount: 0 } : item)))
  }

  const handleHideContent = (contentId) => {
    setContent(
      content.map((item) =>
        item.id === contentId ? { ...item, status: item.status === "hidden" ? "active" : "hidden" } : item,
      ),
    )
  }

  const handleDeleteContent = (contentId) => {
    setContent(content.filter((item) => item.id !== contentId))
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
          <h1 className="text-3xl font-bold">Content Moderation</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and moderate user-generated content</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search content..."
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
              <option value="all">All Content</option>
              <option value="reported">Reported</option>
              <option value="flagged">Flagged</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            >
              <option value="posts">Posts</option>
              <option value="comments">Comments</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredContent.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-600 dark:text-gray-400">No content found matching your criteria.</p>
            </div>
          ) : (
            filteredContent.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border ${
                  item.status === "flagged"
                    ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20"
                    : item.status === "hidden"
                      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                } p-4 shadow-sm`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center">
                      <span className="font-medium text-gray-900 dark:text-white">{item.author}</span>
                      <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                      {item.reportCount > 0 && (
                        <>
                          <span className="mx-2 text-gray-500 dark:text-gray-400">•</span>
                          <span className="flex items-center text-sm text-red-500 dark:text-red-400">
                            <Flag className="mr-1 h-4 w-4" />
                            {item.reportCount} reports
                          </span>
                        </>
                      )}
                    </div>

                    {item.type === "post" && item.title && (
                      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    )}

                    <p className="text-gray-800 dark:text-gray-200">{item.content}</p>

                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <span className="mr-1">👍</span>
                        {item.likes}
                      </span>
                      {item.type === "post" && (
                        <span className="ml-4 flex items-center">
                          <span className="mr-1">💬</span>
                          {item.comments}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex space-x-2">
                    {hasPermission("manageContent") && (
                      <>
                        <button
                          onClick={() => handleApproveContent(item.id)}
                          className="rounded p-1 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                          title="Approve Content"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleHideContent(item.id)}
                          className={`rounded p-1 ${
                            item.status === "hidden"
                              ? "text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30"
                              : "text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
                          }`}
                          title={item.status === "hidden" ? "Unhide Content" : "Hide Content"}
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteContent(item.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                          title="Delete Content"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
