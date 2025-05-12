"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, CheckCircle, Eye, MoreHorizontal, XCircle } from "lucide-react"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import AdminLayout from "@/layouts/admin-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
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

// Mock data for reports
const mockReports = Array.from({ length: 50 }).map((_, i) => ({
  id: `report-${i + 1}`,
  type: ["post", "comment", "user"][Math.floor(Math.random() * 3)],
  targetId: `target-${Math.floor(Math.random() * 100) + 1}`,
  targetContent: `This is the reported ${["post", "comment", "user"][Math.floor(Math.random() * 3)]} content that may violate our community guidelines.`,
  reporterId: `user-${Math.floor(Math.random() * 10) + 1}`,
  reporterName: `User ${Math.floor(Math.random() * 10) + 1}`,
  reason: [
    "Spam or misleading",
    "Harassment or bullying",
    "Hate speech",
    "Violence or threatening content",
    "Nudity or sexual content",
    "Child abuse",
    "Illegal activities",
    "Impersonation",
    "Copyright violation",
    "Other",
  ][Math.floor(Math.random() * 10)],
  details: `Additional details about report ${i + 1}`,
  status: ["pending", "reviewed", "resolved", "dismissed"][Math.floor(Math.random() * 4)],
  createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - Math.floor(Math.random() * 15) * 24 * 60 * 60 * 1000).toISOString(),
}))

export default function AdminReports() {
  const { isAuthenticated, isAdmin, hasPermission } = useAdminAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)
  const [reportsData, setReportsData] = useState(mockReports)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailedView, setShowDetailedView] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const itemsPerPage = 10

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const filterReports = () => {
    let filtered = [...mockReports]

    // Filter by tab (status)
    if (activeTab !== "all") {
      filtered = filtered.filter((report) => report.status === activeTab)
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (report) =>
          report.targetContent.toLowerCase().includes(query) ||
          report.reason.toLowerCase().includes(query) ||
          report.details.toLowerCase().includes(query) ||
          report.reporterName.toLowerCase().includes(query),
      )
    }

    return filtered
  }

  const handleViewReport = (report: any) => {
    setSelectedReport(report)
    setShowDetailedView(true)
  }

  const handleResolveReport = (reportId: string) => {
    // Update report status
    setReportsData((prevReports) =>
      prevReports.map((report) =>
        report.id === reportId ? { ...report, status: "resolved", updatedAt: new Date().toISOString() } : report,
      ),
    )

    toast({
      title: "Report Resolved",
      description: `Report ${reportId} has been marked as resolved.`,
    })

    // If in detailed view, update the selected report
    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport({ ...selectedReport, status: "resolved", updatedAt: new Date().toISOString() })
    }
  }

  const handleDismissReport = (reportId: string) => {
    // Update report status
    setReportsData((prevReports) =>
      prevReports.map((report) =>
        report.id === reportId ? { ...report, status: "dismissed", updatedAt: new Date().toISOString() } : report,
      ),
    )

    toast({
      title: "Report Dismissed",
      description: `Report ${reportId} has been dismissed.`,
    })

    // If in detailed view, update the selected report
    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport({ ...selectedReport, status: "dismissed", updatedAt: new Date().toISOString() })
    }
  }

  const paginateData = (data: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return data.slice(startIndex, endIndex)
  }

  const filteredReports = filterReports()
  const paginatedReports = paginateData(filteredReports)
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)

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
            <h1 className="text-2xl font-bold">Reports Management</h1>
            <p className="text-muted-foreground">Review and manage user reported content</p>
          </div>
        </div>

        {showDetailedView && selectedReport ? (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDetailedView(false)
                    setSelectedReport(null)
                  }}
                >
                  Back to Reports
                </Button>
                <h2 className="text-xl font-semibold">Report Details</h2>
              </div>

              <div className="flex items-center space-x-2">
                {selectedReport.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleResolveReport(selectedReport.id)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Resolve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDismissReport(selectedReport.id)}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Dismiss
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-2">Report Information</h3>
                  <div className="space-y-3 rounded-lg border p-4">
                    <div>
                      <span className="block text-sm font-medium text-muted-foreground">Report ID:</span>
                      <span>{selectedReport.id}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-muted-foreground">Reported By:</span>
                      <span>
                        {selectedReport.reporterName} (ID: {selectedReport.reporterId})
                      </span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-muted-foreground">Date Reported:</span>
                      <span>{new Date(selectedReport.createdAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-muted-foreground">Status:</span>
                      <Badge
                        className={
                          selectedReport.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                            : selectedReport.status === "resolved"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : selectedReport.status === "dismissed"
                                ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        }
                      >
                        {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Reported Content</h3>
                  <div className="space-y-3 rounded-lg border p-4">
                    <div>
                      <span className="block text-sm font-medium text-muted-foreground">Content Type:</span>
                      <span className="capitalize">{selectedReport.type}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-muted-foreground">Content ID:</span>
                      <span>{selectedReport.targetId}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-medium text-muted-foreground">Reason:</span>
                      <span>{selectedReport.reason}</span>
                    </div>
                    <div>
                      <Button size="sm" variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        View Original Content
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Report Details</h3>
                <div className="rounded-lg border p-4">
                  <div className="mb-4">
                    <span className="block text-sm font-medium text-muted-foreground mb-1">Reporter's Comment:</span>
                    <p className="whitespace-pre-wrap">{selectedReport.details}</p>
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-muted-foreground mb-1">Reported Content:</span>
                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <p className="whitespace-pre-wrap">{selectedReport.targetContent}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Admin Notes</h3>
                <div className="rounded-lg border p-4">
                  <textarea
                    className="w-full min-h-[120px] rounded-md border border-gray-300 p-2"
                    placeholder="Add notes about this report and the actions taken..."
                  />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm">Save Notes</Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <>
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">All Reports</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-60"
                />
              </div>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReports.length > 0 ? (
                    paginatedReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          {report.type === "post" ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                              Post
                            </Badge>
                          ) : report.type === "comment" ? (
                            <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                              Comment
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                              User
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[200px]">{report.targetContent}</div>
                        </TableCell>
                        <TableCell>{report.reason}</TableCell>
                        <TableCell>{report.reporterName}</TableCell>
                        <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {report.status === "pending" ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                              Pending
                            </Badge>
                          ) : report.status === "resolved" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              Resolved
                            </Badge>
                          ) : report.status === "dismissed" ? (
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                              Dismissed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                              Reviewed
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
                              <DropdownMenuItem onClick={() => handleViewReport(report)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {report.status === "pending" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleResolveReport(report.id)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Resolve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDismissReport(report.id)}>
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Dismiss
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-center">
                          <AlertTriangle className="h-10 w-10 text-muted-foreground mb-4" />
                          <span className="text-muted-foreground">No reports found</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {filteredReports.length > itemsPerPage && (
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
          </>
        )}
      </div>
    </AdminLayout>
  )
}
