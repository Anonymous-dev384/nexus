"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth-provider"
import axios from "axios"
import { Camera, ImageIcon, X, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface CreateStoryModalProps {
  isOpen: boolean
  onClose: () => void
  onStoryCreated: (story: any) => void
}

export default function CreateStoryModal({ isOpen, onClose, onStoryCreated }: CreateStoryModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mediaType, setMediaType] = useState<"image" | "video">("image")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (file.type.startsWith("image/")) {
      setMediaType("image")
    } else if (file.type.startsWith("video/")) {
      setMediaType("video")
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select an image or video file",
        variant: "destructive",
      })
      return
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast({
        title: "No media selected",
        description: "Please select an image or video for your story",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Upload file
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("upload_preset", "stories")

      const uploadResponse = await axios.post("/api/upload", formData)
      const mediaUrl = uploadResponse.data.url

      // Create story
      const storyData = {
        mediaUrl,
        mediaType,
        caption: caption || undefined,
        location: location || undefined,
      }

      const response = await axios.post("/api/stories", storyData)

      toast({
        title: "Story created",
        description: "Your story has been published successfully",
      })

      onStoryCreated({
        ...response.data,
        user: {
          uid: user?.uid,
          displayName: user?.displayName,
          username: user?.username,
          photoURL: user?.photoURL,
        },
      })

      // Reset form
      setCaption("")
      setLocation("")
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (error) {
      console.error("Error creating story:", error)
      toast({
        title: "Error",
        description: "Failed to create story",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Story</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {previewUrl ? (
            <div className="relative aspect-[9/16] bg-muted rounded-md overflow-hidden">
              {mediaType === "image" ? (
                <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <video src={previewUrl} controls className="w-full h-full object-cover" />
              )}

              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className="aspect-[9/16] bg-muted rounded-md flex flex-col items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <div className="rounded-full bg-background p-3">
                  <Camera className="h-6 w-6" />
                </div>
                <p className="font-medium">Add to your story</p>
                <p className="text-sm text-muted-foreground">Share a photo or video</p>
                <Button type="button" variant="secondary" size="sm" className="mt-2">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Select Media
                </Button>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />

          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                placeholder="Add location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedFile || isSubmitting}>
              {isSubmitting ? "Creating..." : "Share to Story"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
