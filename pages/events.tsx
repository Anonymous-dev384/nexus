"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useAdminAuth } from "@/lib/admin-auth-provider"
import axios from "axios"
import { format, isPast, isFuture } from "date-fns"
import { Calendar, MapPin, Clock, Users, Plus, Filter, ChevronDown, Heart, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Loader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import CreateEventModal from "@/components/events/create-event-modal"

interface Event {
  id: string
  title: string
  description: string
  creatorId: string
  creator: {
    displayName: string
    username: string
    photoURL: string
  }
  coverImage?: string
  location?: {
    type: string
    url?: string
    address?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  startDate: string
  endDate: string
  category: string
  tags: string[]
  attendees: string[]
  interestedUsers: string[]
  isPrivate: boolean
  invitedUsers?: string[]
  maxAttendees?: number
  createdAt: string
}

export default function EventsPage() {
  const { user } = useAuth()
  const { isAdmin, hasPermission } = useAdminAuth()
  const { toast } = useToast()

  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const canCreateEvents = isAdmin && hasPermission("manageEvents")

  const categories = [
    "Social",
    "Technology",
    "Gaming",
    "Education",
    "Arts",
    "Sports",
    "Networking",
    "Entertainment",
    "Other",
  ]

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, activeTab, searchQuery, categoryFilter])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/events")
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
      filtered = filtered.filter((event) => isFuture(new Date(event.startDate)))
    } else if (activeTab === "past") {
      filtered = filtered.filter((event) => isPast(new Date(event.endDate)))
    } else if (activeTab === "my-events") {
      filtered = filtered.filter(
        (event) =>
          event.creatorId === user?.uid ||
          event.attendees.includes(user?.uid || "") ||
          event.interestedUsers.includes(user?.uid || ""),
      )
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(query) ||
          event.description.toLowerCase().includes(query) ||
          event.tags.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Filter by category
    if (categoryFilter) {
      filtered = filtered.filter((event) => event.category === categoryFilter)
    }

    setFilteredEvents(filtered)
  }

  const handleAttendEvent = async (eventId: string) => {
    try {
      await axios.post(`/api/events/${eventId}/attend`)

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId ? { ...event, attendees: [...event.attendees, user?.uid || ""] } : event,
        ),
      )

      toast({
        title: "Success",
        description: "You're now attending this event",
      })
    } catch (error) {
      console.error("Error attending event:", error)
      toast({
        title: "Error",
        description: "Failed to attend event",
        variant: "destructive",
      })
    }
  }

  const handleInterestEvent = async (eventId: string) => {
    try {
      await axios.post(`/api/events/${eventId}/interest`)

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === eventId ? { ...event, interestedUsers: [...event.interestedUsers, user?.uid || ""] } : event,
        ),
      )

      toast({
        title: "Success",
        description: "You've marked interest in this event",
      })
    } catch (error) {
      console.error("Error marking interest:", error)
      toast({
        title: "Error",
        description: "Failed to mark interest",
        variant: "destructive",
      })
    }
  }

  const handleShareEvent = (eventId: string) => {
    // Copy event link to clipboard
    const eventUrl = `${window.location.origin}/events/${eventId}`
    navigator.clipboard.writeText(eventUrl)

    toast({
      title: "Link copied",
      description: "Event link copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-muted-foreground">Discover and join exciting events</p>
        </div>

        {canCreateEvents && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
            <TabsTrigger value="my-events">My Events</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Filter Events</h4>
              <Separator />

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCategoryFilter("")
                    setSearchQuery("")
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <TabsContent value={activeTab} className="mt-0">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.coverImage || "/placeholder.svg?height=200&width=400"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={event.isPrivate ? "secondary" : "default"}>
                      {event.isPrivate ? "Private" : "Public"}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold">{event.title}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(event.startDate), "MMM d, yyyy")}
                      {event.startDate !== event.endDate && ` - ${format(new Date(event.endDate), "MMM d, yyyy")}`}
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      {format(new Date(event.startDate), "h:mm a")}
                    </div>

                    {event.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {event.location.type === "online" ? "Online Event" : event.location.address || "Location TBA"}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-sm line-clamp-2">{event.description}</p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    <Badge variant="outline">{event.category}</Badge>
                    {event.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                    {event.tags.length > 2 && <Badge variant="outline">+{event.tags.length - 2}</Badge>}
                  </div>

                  <div className="flex items-center mt-4 text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    <span>
                      {event.attendees.length}
                      {event.maxAttendees ? ` / ${event.maxAttendees}` : ""} attending
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between pt-0">
                  <Button
                    variant={event.attendees.includes(user?.uid || "") ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAttendEvent(event.id)}
                    disabled={event.attendees.includes(user?.uid || "")}
                  >
                    {event.attendees.includes(user?.uid || "") ? "Attending" : "Attend"}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleInterestEvent(event.id)}
                      className={event.interestedUsers.includes(user?.uid || "") ? "text-red-500" : ""}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>

                    <Button variant="ghost" size="icon" onClick={() => handleShareEvent(event.id)}>
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium">No events found</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              {activeTab === "upcoming"
                ? "There are no upcoming events."
                : activeTab === "past"
                  ? "There are no past events."
                  : "You haven't created or joined any events yet."}
            </p>
            {activeTab !== "past" && canCreateEvents && (
              <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            )}
          </div>
        )}
      </TabsContent>

      {canCreateEvents && (
        <CreateEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onEventCreated={(newEvent) => {
            setEvents((prev) => [newEvent, ...prev])
            setIsCreateModalOpen(false)
          }}
        />
      )}
    </div>
  )
}
