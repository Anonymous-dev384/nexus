"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-provider"
import axios from "axios"
import { formatDistanceToNow } from "date-fns"
import { Plus, X, ChevronLeft, ChevronRight, Heart, MoreHorizontal, ImageIcon, MapPin, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import CreateStoryModal from "@/components/stories/create-story-modal"

interface User {
  uid: string
  displayName: string
  username: string
  photoURL: string
  isFollowing?: boolean
}

interface Story {
  id: string
  userId: string
  user: User
  mediaUrl: string
  mediaType: "image" | "video"
  caption?: string
  location?: string
  viewers: string[]
  reactions: {
    userId: string
    type: string
    createdAt: string
  }[]
  createdAt: string
  expiresAt: string
}

interface StoryGroup {
  user: User
  stories: Story[]
  viewed: boolean
}

export default function StoriesPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([])
  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryGroup | null>(null)
  const [activeStoryIndex, setActiveStoryIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [comment, setComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const progressInterval = useRef<NodeJS.Timeout | null>(null)
  const storyDuration = 5000 // 5 seconds per story

  useEffect(() => {
    fetchStories()
  }, [])

  useEffect(() => {
    if (activeStoryGroup) {
      // Mark story as viewed
      markStoryAsViewed(activeStoryGroup.stories[activeStoryIndex].id)

      // Start progress
      startProgress()

      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current)
        }
      }
    }
  }, [activeStoryGroup, activeStoryIndex])

  const fetchStories = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/stories")

      // Group stories by user
      const groups: StoryGroup[] = []
      const storiesByUser: Record<string, Story[]> = {}

      response.data.forEach((story: Story) => {
        if (!storiesByUser[story.userId]) {
          storiesByUser[story.userId] = []
        }
        storiesByUser[story.userId].push(story)
      })

      // Create story groups
      Object.entries(storiesByUser).forEach(([userId, stories]) => {
        if (stories.length > 0) {
          groups.push({
            user: stories[0].user,
            stories,
            viewed: stories.every((story) => story.viewers.includes(user?.uid || "")),
          })
        }
      })

      setStoryGroups(groups)
    } catch (error) {
      console.error("Error fetching stories:", error)
      toast({
        title: "Error",
        description: "Failed to load stories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const markStoryAsViewed = async (storyId: string) => {
    try {
      await axios.post(`/api/stories/${storyId}/view`)

      // Update local state
      setStoryGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          stories: group.stories.map((story) =>
            story.id === storyId ? { ...story, viewers: [...story.viewers, user?.uid || ""] } : story,
          ),
          viewed: group.stories.every((story) =>
            story.id === storyId ? true : story.viewers.includes(user?.uid || ""),
          ),
        })),
      )
    } catch (error) {
      console.error("Error marking story as viewed:", error)
    }
  }

  const startProgress = () => {
    setProgress(0)

    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }

    const startTime = Date.now()

    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = (elapsed / storyDuration) * 100

      if (newProgress >= 100) {
        clearInterval(progressInterval.current!)
        goToNextStory()
      } else {
        setProgress(newProgress)
      }
    }, 100)
  }

  const openStory = (groupIndex: number) => {
    setActiveStoryGroup(storyGroups[groupIndex])
    setActiveStoryIndex(0)
  }

  const closeStory = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current)
    }
    setActiveStoryGroup(null)
    setActiveStoryIndex(0)
  }

  const goToPreviousStory = () => {
    if (!activeStoryGroup) return

    if (activeStoryIndex > 0) {
      // Previous story in same group
      setActiveStoryIndex(activeStoryIndex - 1)
    } else {
      // Go to previous group
      const currentGroupIndex = storyGroups.findIndex((group) => group.user.uid === activeStoryGroup.user.uid)

      if (currentGroupIndex > 0) {
        const prevGroup = storyGroups[currentGroupIndex - 1]
        setActiveStoryGroup(prevGroup)
        setActiveStoryIndex(prevGroup.stories.length - 1)
      }
    }
  }

  const goToNextStory = () => {
    if (!activeStoryGroup) return

    if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
      // Next story in same group
      setActiveStoryIndex(activeStoryIndex + 1)
    } else {
      // Go to next group
      const currentGroupIndex = storyGroups.findIndex((group) => group.user.uid === activeStoryGroup.user.uid)

      if (currentGroupIndex < storyGroups.length - 1) {
        setActiveStoryGroup(storyGroups[currentGroupIndex + 1])
        setActiveStoryIndex(0)
      } else {
        // End of all stories
        closeStory()
      }
    }
  }

  const handleReaction = async (storyId: string, reactionType: string) => {
    try {
      await axios.post(`/api/stories/${storyId}/react`, { type: reactionType })

      // Update local state
      setStoryGroups((prevGroups) =>
        prevGroups.map((group) => ({
          ...group,
          stories: group.stories.map((story) =>
            story.id === storyId
              ? {
                  ...story,
                  reactions: [
                    ...story.reactions.filter((r) => r.userId !== user?.uid),
                    { userId: user?.uid || "", type: reactionType, createdAt: new Date().toISOString() },
                  ],
                }
              : story,
          ),
        })),
      )

      toast({
        title: "Reaction added",
        description: "Your reaction has been added to the story",
      })
    } catch (error) {
      console.error("Error adding reaction:", error)
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      })
    }
  }

  const handleCommentSubmit = async (storyId: string) => {
    if (!comment.trim()) return

    try {
      setIsSubmittingComment(true)
      await axios.post(`/api/stories/${storyId}/comment`, { content: comment })

      toast({
        title: "Comment sent",
        description: "Your comment has been sent to the user",
      })

      setComment("")
    } catch (error) {
      console.error("Error sending comment:", error)
      toast({
        title: "Error",
        description: "Failed to send comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleStoryCreated = (newStory: Story) => {
    // Find if user already has a story group
    const existingGroupIndex = storyGroups.findIndex((group) => group.user.uid === user?.uid)

    if (existingGroupIndex >= 0) {
      // Add to existing group
      const updatedGroups = [...storyGroups]
      updatedGroups[existingGroupIndex].stories.push(newStory)
      setStoryGroups(updatedGroups)
    } else {
      // Create new group
      setStoryGroups([
        {
          user: {
            uid: user?.uid || "",
            displayName: user?.displayName || "",
            username: user?.username || "",
            photoURL: user?.photoURL || "",
          },
          stories: [newStory],
          viewed: false,
        },
        ...storyGroups,
      ])
    }

    setIsCreateModalOpen(false)
  }

  const getCurrentStory = () => {
    if (!activeStoryGroup) return null
    return activeStoryGroup.stories[activeStoryIndex]
  }

  const currentStory = getCurrentStory()

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* Story viewer */}
      {activeStoryGroup && currentStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <button className="absolute top-4 right-4 text-white z-10" onClick={closeStory}>
            <X className="h-6 w-6" />
          </button>

          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-4 flex gap-1">
            {activeStoryGroup.stories.map((story, index) => (
              <div key={story.id} className="flex-1">
                <Progress
                  value={index === activeStoryIndex ? progress : index < activeStoryIndex ? 100 : 0}
                  className="h-1"
                />
              </div>
            ))}
          </div>

          {/* Story header */}
          <div className="absolute top-10 left-4 right-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-white">
                <AvatarImage src={activeStoryGroup.user.photoURL || "/placeholder.svg"} />
                <AvatarFallback>{activeStoryGroup.user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div>
                <p className="font-medium text-sm">{activeStoryGroup.user.displayName}</p>
                <p className="text-xs opacity-80">
                  {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/stories/${currentStory.id}`)}
                >
                  Copy link
                </DropdownMenuItem>
                {currentStory.userId === user?.uid && (
                  <DropdownMenuItem className="text-red-500">Delete story</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation buttons */}
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-1 text-white"
            onClick={goToPreviousStory}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 rounded-full p-1 text-white"
            onClick={goToNextStory}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Story content */}
          <div className="w-full h-full max-w-md mx-auto flex items-center justify-center">
            {currentStory.mediaType === "image" ? (
              <img
                src={currentStory.mediaUrl || "/placeholder.svg"}
                alt="Story"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <video
                src={currentStory.mediaUrl}
                autoPlay
                muted
                playsInline
                className="max-h-full max-w-full object-contain"
              />
            )}

            {/* Caption */}
            {currentStory.caption && (
              <div className="absolute bottom-24 left-4 right-4 bg-black/50 p-3 rounded-lg text-white">
                <p>{currentStory.caption}</p>

                {currentStory.location && (
                  <div className="flex items-center mt-2 text-sm opacity-80">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span>{currentStory.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Story actions */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Send a message..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <Button
              size="icon"
              variant="ghost"
              className="text-white"
              onClick={() => handleReaction(currentStory.id, "like")}
            >
              <Heart
                className={`h-5 w-5 ${
                  currentStory.reactions.some((r) => r.userId === user?.uid && r.type === "like")
                    ? "fill-red-500 text-red-500"
                    : ""
                }`}
              />
            </Button>

            <Button
              size="icon"
              disabled={!comment.trim() || isSubmittingComment}
              onClick={() => handleCommentSubmit(currentStory.id)}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stories</h1>
            <p className="text-muted-foreground">View stories from people you follow</p>
          </div>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Story
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : storyGroups.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {/* Your story */}
            <div className="flex flex-col items-center cursor-pointer" onClick={() => setIsCreateModalOpen(true)}>
              <div className="relative mb-2">
                <Avatar className="h-16 w-16 border-2 border-dashed border-primary">
                  <AvatarImage src={user?.photoURL || "/placeholder.svg"} />
                  <AvatarFallback>{user?.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
              <span className="text-xs font-medium">Your Story</span>
            </div>

            {/* Other stories */}
            {storyGroups.map((group, index) => (
              <div
                key={group.user.uid}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => openStory(index)}
              >
                <div className="relative mb-2">
                  <div
                    className={`rounded-full p-1 ${group.viewed ? "bg-muted" : "bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500"}`}
                  >
                    <Avatar className="h-16 w-16 border-2 border-background">
                      <AvatarImage src={group.user.photoURL || "/placeholder.svg"} />
                      <AvatarFallback>{group.user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="text-xs font-medium truncate max-w-full">
                  {group.user.uid === user?.uid ? "Your Story" : group.user.username}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-6 mb-4">
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium">No stories yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              Be the first to share a story or follow more people to see their stories here.
            </p>
            <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Story
            </Button>
          </div>
        )}
      </div>

      <CreateStoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onStoryCreated={handleStoryCreated}
      />
    </div>
  )
}
