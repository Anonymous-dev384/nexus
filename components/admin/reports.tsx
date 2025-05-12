"use client"

import { useState, useEffect } from "react"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import { Loader } from "@/components/ui/loader"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { Search, Filter, CheckCircle, XCircle, Eye, MessageSquare, User } from "lucide-react"

export default function AdminReports() {
  const { admin, hasPermission } = useAdminAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("pending")

  useEffect(() => {
    // Fetch reports
    const fetchReports = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        setTimeout(() => {
          setReports([
            {
              id: "1",
              reporterId: "user1",
              reporterName: "user1",
              reportedContentId: "post1",
              reportedContentType: "post",
              reportedUserId: "user2",
              reportedUserName: "user2",
              reason: "Inappropriate content",
              details: "This post contains offensive language",
              status: "pending",
              createdAt: "2023-05-15T10:30:00Z",
              contentPreview: "This is the content that was reported...",
            },
            {
              id: "2",
              reporterId: "user3",
              reporterName: "user3",
              reportedContentId: "comment1",
              reportedContentType: "comment",
              reportedUserId: "user4",
              reportedUserName: "user4",
              reason: "Harassment",
              details: "This user is harassing me in the comments",
              status: "pending",
              createdAt: "2023-05-16T14:20:00Z",
              contentPreview: "This is the comment that was reported...",
            },
            {
              id: "3",
              reporterId: "user5",
              reporterName: "user5",
              reportedContentId: "user6",
              reportedContentType: "user",
              reportedUserId: "user6",
              reportedUserName: "user6",
              reason: "Spam",
              details: "This user is spamming multiple threads",
              status: "resolved",
              createdAt: "2023-05-17T09:15:00Z",
              resolution: "User warned",
              resolvedBy: "admin1",
              resolvedAt: "2023-05-17T11:30:00Z",
            },
            {
              id: "4",
              reporterId: "user7",
              reporterName: "user7",
              reportedContentId: "post2",
              reportedContentType: "post",
              reportedUserId: "user8",
              reportedUserName: "user8",
              reason: "Misinformation",
              details: "This post contains false information",
              status: "dismissed",
              createdAt: "2023-05-18T16:45:00Z",
              resolution: "Content reviewed and found to be acceptable",
              resolvedBy: "admin2",
              resolvedAt: "2023-05-18T17:30:00Z",
            },
          ])
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching reports:", error)
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportedUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.details && report.details.toLowerCase().includes(searchTerm.toLowerCase()))

    if (filter === "all") return matchesSearch
    return matchesSearch && report.status === filter
  })

  const handleResolveReport = (reportId) => {
    setReports(
      reports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: "resolved",
              resolution: "Issue addressed",
              resolvedBy: admin?.name || "admin",
              resolvedAt: new Date().toISOString(),
            }
          : report,
      ),
    )
  }

  const handleDismissReport = (reportId) => {
    setReports(
      reports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: "dismissed",
              resolution: "No action needed",
              resolvedBy: admin?.name || "admin",
              resolvedAt: new Date().toISOString(),
            }
          : report,
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
          <h1 className="text-3xl font-bold">Reports Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and handle user reports</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
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
              <option value="all">All Reports</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-gray-600 dark:text-gray-400">No reports found matching your criteria.</p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className={`rounded-lg border ${
                  report.status === "pending"
                    ? "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20"
                    : report.status === "resolved"
                      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                } p-4 shadow-sm`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        report.status === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : report.status === "resolved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {report.status === "pending" && hasPermission("manageContent") && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResolveReport(report.id)}
                        className="rounded p-1 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30"
                        title="Resolve Report"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDismissReport(report.id)}
                        className="rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
                        title="Dismiss Report"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Report Details</h3>
                    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                      <p className="text-sm">
                        <span className="font-medium">Reason:</span> {report.reason}
                      </p>
                      {report.details && (
                        <p className="text-sm">
                          <span className="font-medium">Details:</span> {report.details}
                        </p>
                      )}
                      <p className="text-sm">
                        <span className="font-medium">Reported by:</span> {report.reporterName}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Reported Content</h3>
                    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                      <p className="text-sm">
                        <span className="font-medium">Type:</span>{" "}
                        {report.reportedContentType.charAt(0).toUpperCase() + report.reportedContentType.slice(1)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">User:</span> {report.reportedUserName}
                      </p>
                      {report.contentPreview && (
                        <p className="text-sm">
                          <span className="font-medium">Preview:</span> {report.contentPreview}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {(report.status === "resolved" || report.status === "dismissed") && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                    <p className="text-sm">
                      <span className="font-medium">Resolution:</span> {report.resolution}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Resolved by:</span> {report.resolvedBy}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Resolved at:</span> {new Date(report.resolvedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex space-x-2">
                  {report.reportedContentType === "post" && (
                    <button className="flex items-center rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
                      <Eye className="mr-1 h-4 w-4" />
                      View Post
                    </button>
                  )}
                  {report.reportedContentType === "comment" && (
                    <button className="flex items-center rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
                      <MessageSquare className="mr-1 h-4 w-4" />
                      View Comment
                    </button>
                  )}
                  <button className="flex items-center rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800">
                    <User className="mr-1 h-4 w-4" />
                    View User
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
