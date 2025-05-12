"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/lib/auth-provider"
import { useAppStore, type Post } from "@/lib/store"
import axios from "axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MoreHorizontal,
  Check,
  Loader2,
  Pin,
  Music,
  Code,
  VoteIcon as PollIcon,
  DollarSign,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface PostCardProps {
  post: Post
  isDetail?: boolean
}

// Add named export for PostCard
export function PostCard({ post, isDetail = false }: PostCardProps) {
  const { user } = useAuth()
  const { likePost, unlikePost, addComment } = useAppStore()
  const { toast } = useToast()

  const [isLiked, setIsLiked] = useState(user ? post.likes.includes(user.uid) : false)
  const [likeCount, setLikeCount] = useState(post.likes.length)
  const [isCommenting, setIsCommenting] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showAllComments, setShowAllComments] = useState(isDetail)
  const [isPinned, setIsPinned] = useState(post.isPinned || false)
  const [isPinning, setIsPinning] = useState(false)
  const [selectedPollOptions, setSelectedPollOptions] = useState<number[]>([])
  const [hasVoted, setHasVoted] = useState(false)
  const [totalVotes, setTotalVotes] = useState(0)

  // Check if user has already voted in this poll
  useEffect(() => {
    if (post.postType === "poll" && post.pollData && user) {
      const userVotes = post.pollData.options.filter((option) => option.votes.includes(user.uid))

      setHasVoted(userVotes.length > 0)

      // Calculate total votes
      const votes = post.pollData.options.reduce((sum, option) => sum + option.votes.length, 0)
      setTotalVotes(votes)
    }
  }, [post, user])

  const handleLike = async () => {
    if (!user) return

    try {
      if (isLiked) {
        // Unlike
        await axios.delete(`/api/posts/${post.id}/likes/${user.uid}`)
        setIsLiked(false)
        setLikeCount((prev) => prev - 1)
        unlikePost(post.id, user.uid)
      } else {
        // Like
        await axios.post(`/api/posts/${post.id}/likes`, { userId: user.uid })
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
        likePost(post.id, user.uid)
      }
    } catch (error) {
      console.error("Error updating like:", error)
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      })
    }
  }

  const handleSubmitComment = async () => {
    if (!user || !commentText.trim()) return

    try {
      setIsSubmittingComment(true)

      const commentData = {
        postId: post.id,
        authorId: user.uid,
        content: commentText,
      }

      const response = await axios.post(`/api/posts/${post.id}/comments`, commentData)

      // Add to local state
      addComment(post.id, {
        id: response.data.id,
        authorId: user.uid,
        author: user,
        content: commentText,
        likes: [],
        createdAt: new Date().toISOString(),
      })

      setCommentText("")
      setIsCommenting(false)

      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Post by ${post.author?.displayName}`,
          text: post.content.substring(0, 50) + "...",
          url: window.location.origin + `/post/${post.id}`,
        })
        .catch((error) => {
          console.error("Error sharing:", error)
        })
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`)
      toast({
        title: "Link copied",
        description: "Post link copied to clipboard",
      })
    }
  }

  const handlePinPost = async () => {
    if (!user) return

    try {
      setIsPinning(true)

      if (isPinned) {
        // Unpin post
        await axios.delete(`/api/users/${user.uid}/pinned/${post.id}`)
        setIsPinned(false)
        toast({
          title: "Post unpinned",
          description: "Post has been removed from your profile",
        })
      } else {
        // Check if user has reached their pin limit
        const response = await axios.get(`/api/users/${user.uid}/pinned`)
        const pinnedPosts = response.data

        if (pinnedPosts.length >= (user.premiumFeatures?.maxPinnedPosts || 1)) {
          toast({
            title: "Pin limit reached",
            description: user.premiumFeatures?.isActive
              ? `You can pin up to ${user.premiumFeatures.maxPinnedPosts} posts`
              : "Upgrade to premium to pin more posts",
            variant: "destructive",
          })
          return
        }

        // Pin post
        await axios.post(`/api/users/${user.uid}/pinned`, { postId: post.id })
        setIsPinned(true)
        toast({
          title: "Post pinned",
          description: "Post has been pinned to your profile",
        })
      }
    } catch (error) {
      console.error("Error updating pin status:", error)
      toast({
        title: "Error",
        description: "Failed to update pin status",
        variant: "destructive",
      })
    } finally {
      setIsPinning(false)
    }
  }

  const handlePollOptionSelect = (index: number) => {
    if (!user || hasVoted) return

    if (post.pollData?.allowMultipleVotes) {
      // Toggle selection for multiple choice
      if (selectedPollOptions.includes(index)) {
        setSelectedPollOptions(selectedPollOptions.filter((i) => i !== index))
      } else {
        setSelectedPollOptions([...selectedPollOptions, index])
      }
    } else {
      // Single choice
      setSelectedPollOptions([index])
    }
  }

  const handleVote = async () => {
    if (!user || !post.pollData || selectedPollOptions.length === 0) return

    try {
      // Submit votes
      await axios.post(`/api/posts/${post.id}/vote`, {
        userId: user.uid,
        optionIndices: selectedPollOptions,
      })

      // Update local state
      setHasVoted(true)
      setTotalVotes((prev) => prev + selectedPollOptions.length)

      toast({
        title: "Vote submitted",
        description: "Your vote has been recorded",
      })
    } catch (error) {
      console.error("Error submitting vote:", error)
      toast({
        title: "Error",
        description: "Failed to submit vote",
        variant: "destructive",
      })
    }
  }

  // Determine which comments to show
  const commentsToShow = showAllComments ? post.comments : post.comments.slice(0, 2)

  // Render post content based on type
  const renderPostContent = () => {
    switch (post.postType) {
      case "poll":
        return (
          <div className="space-y-4 mt-3">
            <h3 className="font-medium text-lg">{post.pollData?.question}</h3>
            <div className="space-y-2">
              {post.pollData?.options.map((option, index) => {
                const votePercentage = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0

                return (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-md border relative overflow-hidden cursor-pointer transition-colors",
                      hasVoted
                        ? "bg-muted"
                        : selectedPollOptions.includes(index)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50",
                    )}
                    onClick={() => handlePollOptionSelect(index)}
                  >
                    {hasVoted && (
                      <div className="absolute inset-0 bg-primary/10 z-0" style={{ width: `${votePercentage}%` }} />
                    )}
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-2">
                        {!hasVoted && post.pollData?.allowMultipleVotes && (
                          <input
                            type="checkbox"
                            checked={selectedPollOptions.includes(index)}
                            readOnly
                            className="h-4 w-4"
                          />
                        )}
                        {!hasVoted && !post.pollData?.allowMultipleVotes && (
                          <input
                            type="radio"
                            checked={selectedPollOptions.includes(index)}
                            readOnly
                            className="h-4 w-4"
                          />
                        )}
                        <span>{option.text}</span>
                      </div>
                      {hasVoted && <span className="text-sm font-medium">{votePercentage}%</span>}
                    </div>
                  </div>
                )
              })}
            </div>

            {!hasVoted && selectedPollOptions.length > 0 && <Button onClick={handleVote}>Vote</Button>}

            {hasVoted && (
              <p className="text-sm text-muted-foreground">
                {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
              </p>
            )}

            {post.pollData?.expiresAt && (
              <p className="text-xs text-muted-foreground">
                Poll {new Date(post.pollData.expiresAt) > new Date() ? "ends" : "ended"}{" "}
                {formatDistanceToNow(new Date(post.pollData.expiresAt), { addSuffix: true })}
              </p>
            )}
          </div>
        )

      case "code":
        return (
          <div className="mt-3 rounded-md overflow-hidden">
            <SyntaxHighlighter
              language={post.codeSnippet?.language || "javascript"}
              style={vscDarkPlus}
              showLineNumbers
            >
              {post.codeSnippet?.code || ""}
            </SyntaxHighlighter>
          </div>
        )

      case "music":
        if (!post.musicEmbed) return null

        return (
          <div className="mt-3 rounded-md overflow-hidden bg-muted p-4">
            {post.musicEmbed.type === "spotify" && (
              <iframe
                src={post.musicEmbed.url.replace("https://open.spotify.com/", "https://open.spotify.com/embed/")}
                width="100%"
                height="80"
                frameBorder="0"
                allow="encrypted-media"
              />
            )}

            {post.musicEmbed.type === "soundcloud" && (
              <iframe
                width="100%"
                height="166"
                scrolling="no"
                frameBorder="no"
                allow="autoplay"
                src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(post.musicEmbed.url)}`}
              />
            )}

            {post.musicEmbed.type === "audiomack" && (
              <iframe
                src={post.musicEmbed.url.replace("audiomack.com", "audiomack.com/embed")}
                scrolling="no"
                width="100%"
                height="252"
                frameBorder="0"
              />
            )}

            {post.musicEmbed.type === "audio" && (
              <div className="space-y-2">
                {(post.musicEmbed.title || post.musicEmbed.artist) && (
                  <div>
                    {post.musicEmbed.title && <p className="font-medium">{post.musicEmbed.title}</p>}
                    {post.musicEmbed.artist && (
                      <p className="text-sm text-muted-foreground">{post.musicEmbed.artist}</p>
                    )}
                  </div>
                )}
                <audio src={post.musicEmbed.url} controls className="w-full" />
              </div>
            )}
          </div>
        )

      case "collab":
        return (
          <div>
            <p className="whitespace-pre-line">{post.content}</p>

            {post.collaboratorIds && post.collaboratorIds.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">In collaboration with:</span>
                <div className="flex -space-x-2">
                  {post.collaboratorIds.map((collaboratorId, index) => (
                    <Avatar key={index} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback>{collaboratorId.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>
            )}

            {post.media && post.media.length > 0 && (
              <div className={`mt-3 grid gap-2 ${post.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                {post.media.map((media, index) => (
                  <div key={index} className="rounded-md overflow-hidden bg-muted">
                    {media.type === "image" ? (
                      <img
                        src={media.url || "/placeholder.svg"}
                        alt="Post media"
                        className="w-full object-cover"
                        style={{ maxHeight: "400px" }}
                      />
                    ) : (
                      <video src={media.url} controls className="w-full" style={{ maxHeight: "400px" }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      default: // standard post
        return (
          <>
            <p className="whitespace-pre-line">{post.content}</p>

            {post.media && post.media.length > 0 && (
              <div className={`mt-3 grid gap-2 ${post.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                {post.media.map((media, index) => (
                  <div key={index} className="rounded-md overflow-hidden bg-muted">
                    {media.type === "image" ? (
                      <img
                        src={media.url || "/placeholder.svg"}
                        alt="Post media"
                        className="w-full object-cover"
                        style={{ maxHeight: "400px" }}
                      />
                    ) : (
                      <video src={media.url} controls className="w-full" style={{ maxHeight: "400px" }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )
    }
  }

  return (
    <Card className="mb-4 overflow-hidden border-border">
      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author?.username}`}>
              <Avatar>
                <AvatarImage src={post.author?.photoURL || "/placeholder.svg"} alt={post.author?.displayName} />
                <AvatarFallback>{post.author?.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <Link to={`/profile/${post.author?.username}`} className="font-medium hover:underline">
                  {post.author?.displayName}
                </Link>

                {post.author?.verificationStatus?.verified && (
                  <Badge variant="outline" className="h-5 px-1 bg-blue-500/10 text-blue-500">
                    <Check className="h-3 w-3 mr-1" />
                    <span className="text-xs">Verified</span>
                  </Badge>
                )}

                {post.author?.verificationStatus?.earningVerified && (
                  <Badge variant="outline" className="h-5 px-1 bg-green-500/10 text-green-500">
                    <DollarSign className="h-3 w-3 mr-1" />
                    <span className="text-xs">Earning</span>
                  </Badge>
                )}

                {isPinned && (
                  <Badge variant="outline" className="h-5 px-1 bg-orange-500/10 text-orange-500">
                    <Pin className="h-3 w-3 mr-1" />
                    <span className="text-xs">Pinned</span>
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>@{post.author?.username}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>

                {post.sentiment && (
                  <Badge variant="outline" className="h-5 px-1">
                    <span className="text-xs capitalize">{post.sentiment}</span>
                  </Badge>
                )}

                {post.visibility === "premium" && (
                  <Badge variant="outline" className="h-5 px-1 bg-purple-500/10 text-purple-500">
                    <span className="text-xs">Premium</span>
                  </Badge>
                )}

                {post.postType !== "standard" && (
                  <Badge variant="outline" className="h-5 px-1">
                    {post.postType === "poll" && <PollIcon className="h-3 w-3 mr-1" />}
                    {post.postType === "code" && <Code className="h-3 w-3 mr-1" />}
                    {post.postType === "music" && <Music className="h-3 w-3 mr-1" />}
                    <span className="text-xs capitalize">{post.postType}</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Bookmark className="h-4 w-4 mr-2" />
                Save post
              </DropdownMenuItem>

              {user && post.author?.uid === user.uid && (
                <DropdownMenuItem onClick={handlePinPost} disabled={isPinning}>
                  <Pin className="h-4 w-4 mr-2" />
                  {isPinning ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isPinned ? (
                    "Unpin from profile"
                  ) : (
                    "Pin to profile"
                  )}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Report post</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <Link to={`/post/${post.id}`} className="block">
          {renderPostContent()}
        </Link>

        {post.isThread && (
          <Badge variant="outline" className="mt-3">
            Thread
          </Badge>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-9 w-9", isLiked && "text-red-500")}
              onClick={handleLike}
            >
              <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
            </Button>
            <span className="text-sm">{likeCount}</span>
          </div>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setIsCommenting(!isCommenting)}>
            <MessageCircle className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare}>
            <Share className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>

        {/* Comments section */}
        {post.comments.length > 0 && (
          <div className="mt-4 w-full space-y-3">
            {commentsToShow.map((comment) => (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.author?.photoURL || "/placeholder.svg"} alt={comment.author?.displayName} />
                  <AvatarFallback>{comment.author?.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 bg-muted rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{comment.author?.displayName}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm">{comment.content}</p>
                </div>
              </div>
            ))}

            {post.comments.length > 2 && !showAllComments && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setShowAllComments(true)}
              >
                View all {post.comments.length} comments
              </Button>
            )}
          </div>
        )}

        {/* Comment input */}
        {isCommenting && (
          <div className="mt-4 w-full space-y-2">
            <div className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || "/placeholder.svg"} alt={user?.displayName} />
                <AvatarFallback>{user?.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  placeholder="Add a comment..."
                  className="min-h-[60px] resize-none"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsCommenting(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmitComment} disabled={!commentText.trim() || isSubmittingComment}>
                {isSubmittingComment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>Post</>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

// Keep default export for backward compatibility
export default PostCard
