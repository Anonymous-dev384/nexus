"use client"

import { useState, useEffect } from "react"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import axios from "axios"
import { format } from "date-fns"
import { Calendar, Plus, Search, MoreHorizontal, Edit, Trash, Eye, XCircle } from "lucide-react"
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
import CreateEventModal from "@/components/events/create-event-modal"

interface Event {
  id: string
  title: string
  description: string
  creatorId: string
  creator: {
    displayName: string
    username: string
  }
  startDate: string
  endDate: string
  category: string
  attendees: string[]
  isPrivate: boolean
  createdAt: string
}

export default function AdminEventsPage() {
  const { isAdmin, hasPermission } = useAdminAuth()
  const { toast } = useToast()

  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    if (isAdmin && hasPermission("manageEvents")) {
      fetchEvents()
    }
  }, [isAdmin])

  useEffect(() => {
    filterEvents()
  }, [events, activeTab, searchQuery])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/admin/events")
      setEvents(response.data)
    } catch (error) {
      console.error("Error fetching events:", error)
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = [...events]

    // Filter by tab
    if (activeTab === "upcoming") {
      filtered = filtered.filter((event) => new Date(event.startDate) > new Date())
    } else if (activeTab === "past") {
      filtered = filtered.filter((event) => new Date(event.endDate) < new Date())
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.category.toLowerCase().includes(query) ||
          event.creator.displayName.toLowerCase().includes(query) ||
          event.creator.username.toLowerCase().includes(query),
      )
    }

    setFilteredEvents(filtered)
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await axios.delete(`/api/admin/events/${eventId}`)

      // Update local state
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId))

      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      })
    }
  }

  if (!isAdmin) {
    return <AdminLogin />
  }

  if (!hasPermission("manageEvents")) {
    return (
      <div className="flex min-h-screen bg-muted/20">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have permission to manage events</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar />

      <div className="flex-1">
        <AdminHeader title="Events Management" description="Create and manage platform events" />

        <main className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Events</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search events..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.title}</TableCell>
                      <TableCell>{event.category}</TableCell>
                      <TableCell>{format(new Date(event.startDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{event.creator.displayName}</TableCell>
                      <TableCell>{event.attendees.length}</TableCell>
                      <TableCell>
                        {new Date(event.startDate) > new Date() ? (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200">
                            Upcoming
                          </Badge>
                        ) : new Date(event.endDate) < new Date() ? (
                          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-200">
                            Past
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-200">
                            Active
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
                              Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete Event
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
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">No events found</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                {searchQuery
                  ? "No events match your search criteria. Try a different search term."
                  : "There are no events in this category. Create one to get started!"}
              </p>
              <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          )}
        </main>
      </div>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={(newEvent) => {
          setEvents((prev) => [newEvent, ...prev])
          setIsCreateModalOpen(false)
        }}
      />
    </div>
  )
}
