"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useAppStore } from "@/lib/store"
import axios from "axios"
import { uploadImage, uploadAudio } from "@/lib/cloudinary"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, ImageIcon, X, Film, Calendar, Music, Code, PlusCircle, VoteIcon as Poll } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"

// Supported code languages
const CODE_LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
]

export default function ComposePostModal() {
  const { user } = useAuth()
  const { isComposingPost, setIsComposingPost, addPost } = useAppStore()
  const { toast } = useToast()

  const [content, setContent] = useState("")
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isThread, setIsThread] = useState(false)
  const [sentiment, setSentiment] = useState<string | null>(null)
  const [scheduledDate, setScheduledDate] = useState<string | null>(null)
  const [postType, setPostType] = useState<"standard" | "poll" | "code" | "music" | "collab">("standard")
  const [visibility, setVisibility] = useState<"public" | "premium" | "followers">("public")
  const [collaborator, setCollaborator] = useState<string>("")
  const [collaborators, setCollaborators] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState<string>("")

  // Poll specific state
  const [pollQuestion, setPollQuestion] = useState<string>("")
  const [pollOptions, setPollOptions] = useState<{ text: string; votes: string[] }[]>([
    { text: "", votes: [] },
    { text: "", votes: [] },
  ])
  const [allowMultipleVotes, setAllowMultipleVotes] = useState<boolean>(false)
  const [pollExpiration, setPollExpiration] = useState<string | null>(null)

  // Code snippet specific state
  const [codeLanguage, setCodeLanguage] = useState<string>("javascript")
  const [codeSnippet, setCodeSnippet] = useState<string>("")

  // Music embed specific state
  const [musicType, setMusicType] = useState<"spotify" | "soundcloud" | "audiomack" | "audio">("spotify")
  const [musicUrl, setMusicUrl] = useState<string>("")
  const [musicTitle, setMusicTitle] = useState<string>("")
  const [musicArtist, setMusicArtist] = useState<string>("")
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const handleClose = () => {
    setIsComposingPost(false)
    resetForm()
  }

  const resetForm = () => {
    setContent("")
    setMediaFiles([])
    setMediaPreviewUrls([])
    setIsThread(false)
    setSentiment(null)
    setScheduledDate(null)
    setPostType("standard")
    setVisibility("public")
    setCollaborator("")
    setCollaborators([])
    setTags([])
    setCurrentTag("")
    setPollQuestion("")
    setPollOptions([
      { text: "", votes: [] },
      { text: "", votes: [] },
    ])
    setAllowMultipleVotes(false)
    setPollExpiration(null)
    setCodeLanguage("javascript")
    setCodeSnippet("")
    setMusicType("spotify")
    setMusicUrl("")
    setMusicTitle("")
    setMusicArtist("")
    setAudioFile(null)
    setAudioPreviewUrl(null)
  }

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)

      // Check if user is verified for multiple media
      if (!user?.verificationStatus.verified && files.length + mediaFiles.length > 1) {
        toast({
          title: "Feature limited",
          description: "Only verified users can post multiple media files",
          variant: "destructive",
        })
        return
      }

      // Add new files
      setMediaFiles((prev) => [...prev, ...files])

      // Create preview URLs
      const newPreviewUrls = files.map((file) => URL.createObjectURL(file))
      setMediaPreviewUrls((prev) => [...prev, ...newPreviewUrls])
    }
  }

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAudioFile(file)
      setAudioPreviewUrl(URL.createObjectURL(file))
    }
  }

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))

    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(mediaPreviewUrls[index])
    setMediaPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const addPollOption = () => {
    if (pollOptions.length < 10) {
      setPollOptions([...pollOptions, { text: "", votes: [] }])
    } else {
      toast({
        title: "Maximum options reached",
        description: "You can add up to 10 options for a poll",
        variant: "destructive",
      })
    }
  }

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index))
    } else {
      toast({
        title: "Minimum options required",
        description: "A poll must have at least 2 options",
        variant: "destructive",
      })
    }
  }

  const updatePollOption = (index: number, text: string) => {
    const newOptions = [...pollOptions]
    newOptions[index].text = text
    setPollOptions(newOptions)
  }

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const addCollaborator = () => {
    if (collaborator.trim() && !collaborators.includes(collaborator.trim())) {
      setCollaborators([...collaborators, collaborator.trim()])
      setCollaborator("")
    }
  }

  const removeCollaborator = (username: string) => {
    setCollaborators(collaborators.filter((c) => c !== username))
  }

  const validateForm = () => {
    // Basic validation
    if (postType === "standard" && content.trim() === "" && mediaFiles.length === 0) {
      toast({
        title: "Empty post",
        description: "Please add some content to your post",
        variant: "destructive",
      })
      return false
    }

    // Poll validation
    if (postType === "poll") {
      if (!pollQuestion.trim()) {
        toast({
          title: "Missing poll question",
          description: "Please add a question for your poll",
          variant: "destructive",
        })
        return false
      }

      const validOptions = pollOptions.filter((option) => option.text.trim() !== "")
      if (validOptions.length < 2) {
        toast({
          title: "Insufficient poll options",
          description: "Please add at least 2 valid options for your poll",
          variant: "destructive",
        })
        return false
      }
    }

    // Code snippet validation
    if (postType === "code" && !codeSnippet.trim()) {
      toast({
        title: "Empty code snippet",
        description: "Please add some code to your snippet",
        variant: "destructive",
      })
      return false
    }

    // Music embed validation
    if (postType === "music") {
      if (musicType !== "audio" && !musicUrl.trim()) {
        toast({
          title: "Missing music URL",
          description: "Please add a URL for your music embed",
          variant: "destructive",
        })
        return false
      }

      if (musicType === "audio" && !audioFile) {
        toast({
          title: "Missing audio file",
          description: "Please upload an audio file",
          variant: "destructive",
        })
        return false
      }
    }

    // Premium content validation
    if (visibility === "premium" && !user?.premiumFeatures.isActive && user?.role !== "premium") {
      toast({
        title: "Premium required",
        description: "You need to be a premium user to post premium content",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!user) return

    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      // Upload media files if any
      const mediaUrls = []

      for (const file of mediaFiles) {
        const downloadUrl = await uploadImage(file)

        const fileType = file.type.startsWith("image/") ? "image" : "video"
        mediaUrls.push({
          type: fileType,
          url: downloadUrl,
        })
      }

      // Prepare post data based on type
      const postData: any = {
        authorId: user.uid,
        content,
        media: mediaUrls.length > 0 ? mediaUrls : undefined,
        isThread,
        sentiment: sentiment || undefined,
        scheduledDate: scheduledDate || undefined,
        postType,
        visibility,
        tags,
      }

      // Add collaborators if any
      if (collaborators.length > 0 && postType === "collab") {
        postData.collaboratorIds = collaborators
      }

      // Add poll data if poll type
      if (postType === "poll") {
        postData.pollData = {
          question: pollQuestion,
          options: pollOptions.filter((option) => option.text.trim() !== ""),
          allowMultipleVotes,
          expiresAt: pollExpiration ? new Date(pollExpiration).toISOString() : undefined,
        }
      }

      // Add code snippet if code type
      if (postType === "code") {
        postData.codeSnippet = {
          language: codeLanguage,
          code: codeSnippet,
        }
      }

      // Add music embed if music type
      if (postType === "music") {
        const musicData: any = {
          type: musicType,
          url: musicUrl,
          title: musicTitle || undefined,
          artist: musicArtist || undefined,
        }

        // Upload audio file if selected
        if (musicType === "audio" && audioFile) {
          const audioUrl = await uploadAudio(audioFile)
          musicData.url = audioUrl
        }

        postData.musicEmbed = musicData
      }

      // Create post
      const response = await axios.post("/api/posts", postData)

      // Add to local state
      addPost({
        id: response.data.id,
        ...postData,
        author: user,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
      })

      toast({
        title: "Post created",
        description: "Your post has been published successfully",
      })

      handleClose()
    } catch (error: any) {
      console.error("Error creating post:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      mediaPreviewUrls.forEach((url) => URL.revokeObjectURL(url))
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl)
    }
  }, [mediaPreviewUrls, audioPreviewUrl])

  return (
    <Dialog open={isComposingPost} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 mt-4">
          <Avatar>
            <AvatarImage src={user?.photoURL || "/placeholder.svg"} alt={user?.displayName} />
            <AvatarFallback>{user?.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            {/* Post type selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge
                variant={postType === "standard" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPostType("standard")}
              >
                Standard
              </Badge>
              <Badge
                variant={postType === "poll" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPostType("poll")}
              >
                <Poll className="w-3 h-3 mr-1" />
                Poll
              </Badge>
              <Badge
                variant={postType === "code" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPostType("code")}
              >
                <Code className="w-3 h-3 mr-1" />
                Code
              </Badge>
              <Badge
                variant={postType === "music" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPostType("music")}
              >
                <Music className="w-3 h-3 mr-1" />
                Music
              </Badge>
              <Badge
                variant={postType === "collab" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setPostType("collab")}
              >
                <PlusCircle className="w-3 h-3 mr-1" />
                Collab
              </Badge>
            </div>

            {/* Standard post content */}
            {postType === "standard" && (
              <>
                <Textarea
                  placeholder="What's on your mind?"
                  className="min-h-[120px] resize-none border-none text-lg focus-visible:ring-0 p-0"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSubmitting}
                />

                {mediaPreviewUrls.length > 0 && (
                  <div className={`grid gap-2 ${mediaPreviewUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                    {mediaPreviewUrls.map((url, index) => (
                      <div key={index} className="relative rounded-md overflow-hidden aspect-video bg-muted">
                        {mediaFiles[index]?.type.startsWith("image/") ? (
                          <img src={url || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <video src={url} className="w-full h-full object-cover" controls />
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 rounded-full"
                          onClick={() => removeMedia(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Poll content */}
            {postType === "poll" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="poll-question">Poll Question</Label>
                  <Input
                    id="poll-question"
                    placeholder="Ask a question..."
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Options</Label>
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option.text}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                      />
                      {pollOptions.length > 2 && (
                        <Button variant="ghost" size="icon" onClick={() => removePollOption(index)} className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addPollOption} className="mt-2">
                    Add Option
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch id="multiple-votes" checked={allowMultipleVotes} onCheckedChange={setAllowMultipleVotes} />
                  <Label htmlFor="multiple-votes">Allow multiple votes</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poll-expiration">Poll Expiration (Optional)</Label>
                  <Input
                    id="poll-expiration"
                    type="datetime-local"
                    value={pollExpiration || ""}
                    onChange={(e) => setPollExpiration(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
            )}

            {/* Code snippet content */}
            {postType === "code" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code-language">Language</Label>
                  <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {CODE_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code-snippet">Code</Label>
                  <Textarea
                    id="code-snippet"
                    placeholder="Paste your code here..."
                    className="font-mono min-h-[200px]"
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                  />
                </div>

                {codeSnippet && (
                  <div className="rounded-md overflow-hidden">
                    <SyntaxHighlighter language={codeLanguage} style={vscDarkPlus} showLineNumbers>
                      {codeSnippet}
                    </SyntaxHighlighter>
                  </div>
                )}
              </div>
            )}

            {/* Music embed content */}
            {postType === "music" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="music-type">Music Source</Label>
                  <Select value={musicType} onValueChange={(value: any) => setMusicType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select music source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spotify">Spotify</SelectItem>
                      <SelectItem value="soundcloud">SoundCloud</SelectItem>
                      <SelectItem value="audiomack">Audiomack</SelectItem>
                      <SelectItem value="audio">Upload Audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {musicType === "audio" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="audio-file">Audio File</Label>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => audioInputRef.current?.click()} className="w-full">
                          <Music className="h-4 w-4 mr-2" />
                          {audioFile ? "Change Audio File" : "Upload Audio File"}
                        </Button>
                        <input
                          type="file"
                          ref={audioInputRef}
                          className="hidden"
                          accept="audio/*"
                          onChange={handleAudioSelect}
                        />
                      </div>
                    </div>

                    {audioPreviewUrl && (
                      <div className="rounded-md overflow-hidden bg-muted p-4">
                        <audio src={audioPreviewUrl} controls className="w-full" />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="music-title">Title (Optional)</Label>
                      <Input
                        id="music-title"
                        placeholder="Song title"
                        value={musicTitle}
                        onChange={(e) => setMusicTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="music-artist">Artist (Optional)</Label>
                      <Input
                        id="music-artist"
                        placeholder="Artist name"
                        value={musicArtist}
                        onChange={(e) => setMusicArtist(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="music-url">
                        {musicType === "spotify"
                          ? "Spotify URL"
                          : musicType === "soundcloud"
                            ? "SoundCloud URL"
                            : "Audiomack URL"}
                      </Label>
                      <Input
                        id="music-url"
                        placeholder={`Paste ${musicType} link here...`}
                        value={musicUrl}
                        onChange={(e) => setMusicUrl(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {musicType === "spotify"
                          ? "Example: https://open.spotify.com/track/..."
                          : musicType === "soundcloud"
                            ? "Example: https://soundcloud.com/artist/track"
                            : "Example: https://audiomack.com/artist/song"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Collab post content */}
            {postType === "collab" && (
              <div className="space-y-4">
                <Textarea
                  placeholder="What's on your mind?"
                  className="min-h-[120px] resize-none border-none text-lg focus-visible:ring-0 p-0"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSubmitting}
                />

                <div className="space-y-2">
                  <Label htmlFor="collaborator">Add Collaborators</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="collaborator"
                      placeholder="Enter username"
                      value={collaborator}
                      onChange={(e) => setCollaborator(e.target.value)}
                    />
                    <Button variant="outline" onClick={addCollaborator}>
                      Add
                    </Button>
                  </div>
                </div>

                {collaborators.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {collaborators.map((collab) => (
                      <Badge key={collab} variant="secondary" className="flex items-center gap-1">
                        {collab}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeCollaborator(collab)} />
                      </Badge>
                    ))}
                  </div>
                )}

                {mediaPreviewUrls.length > 0 && (
                  <div className={`grid gap-2 ${mediaPreviewUrls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                    {mediaPreviewUrls.map((url, index) => (
                      <div key={index} className="relative rounded-md overflow-hidden aspect-video bg-muted">
                        {mediaFiles[index]?.type.startsWith("image/") ? (
                          <img src={url || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <video src={url} className="w-full h-full object-cover" controls />
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 rounded-full"
                          onClick={() => removeMedia(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tags for all post types */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tags"
                  placeholder="Add a tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addTag()
                    }
                  }}
                />
                <Button variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      #{tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Tabs defaultValue="media" className="w-full">
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="options">Options</TabsTrigger>
                <TabsTrigger value="visibility">Visibility</TabsTrigger>
              </TabsList>

              <TabsContent value="media" className="space-y-4">
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Add Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Film className="h-4 w-4" />
                    Add Video
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*"
                    multiple={user?.verificationStatus.verified}
                    onChange={handleMediaSelect}
                  />
                </div>
              </TabsContent>

              <TabsContent value="options" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="thread-option"
                      checked={isThread}
                      onChange={(e) => setIsThread(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="thread-option">Create as thread</label>
                    {isThread && !user?.premiumFeatures.extendedThreads && !user?.premiumFeatures.isActive && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Limited to 3 posts (Premium: unlimited)
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Post sentiment (AI-detected)</p>
                    <div className="flex flex-wrap gap-2">
                      {["happy", "motivated", "neutral", "sad", "angry"].map((emotion) => (
                        <Badge
                          key={emotion}
                          variant={sentiment === emotion ? "default" : "outline"}
                          className="cursor-pointer capitalize"
                          onClick={() => setSentiment(emotion)}
                        >
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="visibility" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="visibility">Who can see this post?</Label>
                  <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Everyone</SelectItem>
                      <SelectItem value="followers">Followers only</SelectItem>
                      <SelectItem
                        value="premium"
                        disabled={!user?.premiumFeatures.isActive && user?.role !== "premium"}
                      >
                        Premium users only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {visibility === "premium" && !user?.premiumFeatures.isActive && user?.role !== "premium" && (
                    <p className="text-xs text-amber-500">You need to be a premium user to post premium-only content</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Schedule post
                  </p>
                  <input
                    type="datetime-local"
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  {scheduledDate && (
                    <p className="text-xs text-muted-foreground">
                      Your post will be published on {new Date(scheduledDate).toLocaleString()}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>Post</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
