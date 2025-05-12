"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import axios from "axios"
import { CalendarIcon, X, Search } from "lucide-react"
import { format, addDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface CreateChallengeModalProps {
  isOpen: boolean
  onClose: () => void
  onChallengeCreated: (challenge: any) => void
}

interface User {
  uid: string
  displayName: string
  username: string
  photoURL: string
}

export default function CreateChallengeModal({ isOpen, onClose, onChallengeCreated }: CreateChallengeModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "post",
    criteriaDescription: "",
    deadline: addDays(new Date(), 7),
    mediaRequired: false,
    minLikes: "",
    challengedUser: null as User | null,
    hashtags: [] as string[],
    rewardTokens: "10",
    rewardXp: "50",
  })

  const [currentTag, setCurrentTag] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const challengeTypes = [
    { value: "post", label: "Create a Post" },
    { value: "media", label: "Share Media" },
    { value: "activity", label: "Complete Activity" },
    { value: "custom", label: "Custom Challenge" },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({ ...prev, deadline: date }))
    }
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleAddTag = () => {
    if (currentTag && !formData.hashtags.includes(currentTag) && formData.hashtags.length < 5) {
      setFormData((prev) => ({ ...prev, hashtags: [...prev.hashtags, currentTag] }))
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, hashtags: prev.hashtags.filter((t) => t !== tag) }))
  }

  const handleUserSearch = async (query: string) => {
    setSearchQuery(query)

    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const response = await axios.get(`/api/users/search?q=${query}`)
      setSearchResults(response.data.filter((u: User) => u.uid !== user?.uid))
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectUser = (selectedUser: User) => {
    setFormData((prev) => ({ ...prev, challengedUser: selectedUser }))
    setSearchQuery("")
    setSearchResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.criteriaDescription || !formData.challengedUser) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const challengeData = {
        title: formData.title,
        description: formData.description,
        challengedUserId: formData.challengedUser.uid,
        type: formData.type,
        criteria: {
          description: formData.criteriaDescription,
          deadline: formData.deadline,
          mediaRequired: formData.mediaRequired,
          minLikes: formData.minLikes ? Number.parseInt(formData.minLikes) : undefined,
          hashtags: formData.hashtags.length > 0 ? formData.hashtags : undefined,
        },
        reward: {
          tokens: Number.parseInt(formData.rewardTokens),
          xp: Number.parseInt(formData.rewardXp),
        },
      }

      const response = await axios.post("/api/challenges", challengeData)

      toast({
        title: "Challenge created",
        description: "Your challenge has been sent successfully",
      })

      onChallengeCreated({
        ...response.data,
        creator: {
          displayName: user?.displayName,
          username: user?.username,
          photoURL: user?.photoURL,
        },
        challengedUser: formData.challengedUser,
      })
    } catch (error) {
      console.error("Error creating challenge:", error)
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Challenge</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Challenge Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter challenge title"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your challenge"
                rows={3}
                required
              />
            </div>

            <div>
              <Label>Challenge Type *</Label>
              <RadioGroup
                value={formData.type}
                onValueChange={(value) => handleSelectChange("type", value)}
                className="flex flex-col space-y-1 mt-2"
              >
                {challengeTypes.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={type.value} id={type.value} />
                    <Label htmlFor={type.value}>{type.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="criteriaDescription">Challenge Criteria *</Label>
              <Textarea
                id="criteriaDescription"
                name="criteriaDescription"
                value={formData.criteriaDescription}
                onChange={handleChange}
                placeholder="Describe what needs to be done to complete this challenge"
                rows={3}
                required
              />
            </div>

            <div>
              <Label>Deadline</Label>
              <div className="flex mt-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.deadline && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.deadline ? format(formData.deadline, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.deadline}
                      onSelect={handleDateChange}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mediaRequired">Require Media</Label>
                  <p className="text-xs text-muted-foreground">Challenge requires photo/video</p>
                </div>
                <Switch
                  id="mediaRequired"
                  checked={formData.mediaRequired}
                  onCheckedChange={(checked) => handleSwitchChange("mediaRequired", checked)}
                />
              </div>

              <div>
                <Label htmlFor="minLikes">Minimum Likes</Label>
                <Input
                  id="minLikes"
                  name="minLikes"
                  type="number"
                  min="0"
                  value={formData.minLikes}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <Label>Hashtags (up to 5)</Label>
              <div className="flex mt-1">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Add a hashtag"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!currentTag || formData.hashtags.length >= 5}
                  className="ml-2"
                >
                  Add
                </Button>
              </div>

              {formData.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.hashtags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded-full hover:bg-muted p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Challenge User *</Label>
              <div className="relative mt-1">
                <Popover open={searchResults.length > 0}>
                  <PopoverTrigger asChild>
                    <div>
                      {formData.challengedUser ? (
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                          <img
                            src={formData.challengedUser.photoURL || "/placeholder.svg"}
                            alt={formData.challengedUser.displayName}
                            className="h-6 w-6 rounded-full"
                          />
                          <div>
                            <p className="text-sm font-medium">{formData.challengedUser.displayName}</p>
                            <p className="text-xs text-muted-foreground">@{formData.challengedUser.username}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-6 w-6 p-0"
                            onClick={() => setFormData((prev) => ({ ...prev, challengedUser: null }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => handleUserSearch(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[300px]" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search users..."
                        value={searchQuery}
                        onValueChange={handleUserSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No users found</CommandEmpty>
                        <CommandGroup>
                          {searchResults.map((user) => (
                            <CommandItem
                              key={user.uid}
                              onSelect={() => handleSelectUser(user)}
                              className="flex items-center gap-2 p-2"
                            >
                              <img
                                src={user.photoURL || "/placeholder.svg"}
                                alt={user.displayName}
                                className="h-6 w-6 rounded-full"
                              />
                              <div>
                                <p className="text-sm font-medium">{user.displayName}</p>
                                <p className="text-xs text-muted-foreground">@{user.username}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rewardTokens">Token Reward</Label>
                <Input
                  id="rewardTokens"
                  name="rewardTokens"
                  type="number"
                  min="0"
                  value={formData.rewardTokens}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              <div>
                <Label htmlFor="rewardXp">XP Reward</Label>
                <Input
                  id="rewardXp"
                  name="rewardXp"
                  type="number"
                  min="0"
                  value={formData.rewardXp}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Challenge"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
