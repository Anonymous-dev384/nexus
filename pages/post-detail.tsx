"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
import {
  MessageSquare,
  Heart,
  Share2,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  Send,
  User,
  AlertTriangle,
  ThumbsUp,
} from "lucide-react"
import MainLayout from "../layouts/main-layout"
import { useAuth } from "../lib/auth-provider"
import { db } from "../lib/firebase"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  increment,
  serverTimestamp,
  deleteDoc,
  limit as firestoreLimit,
} from "firebase/firestore"
import { Loader } from "../components/ui/loader"
import { VerificationBadges } from "../components/profile/verification-badges"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Textarea } from "../components/ui/textarea"
import { Button } from "../components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"

export default function PostDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const { id } = router.query

  const [post, setPost] = useState<any>(null)
  const [author, setAuthor] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState("")

  useEffect(() => {
    if (!id || !user) return

    const fetchPostData = async () => {
      try {
        const postDoc = await getDoc(doc(db, "posts", id as string))

        if (!postDoc.exists()) {
          router.push("/not-found")
          return
        }

        const postData = { id: postDoc.id, ...postDoc.data() }
        setPost(postData)

        // Fetch post author
        const authorDoc = await getDoc(doc(db, "users", postData.userId))
        if (authorDoc.exists()) {
          setAuthor({ id: authorDoc.id, ...authorDoc.data() })
        }

        // Fetch comments
        const commentsQuery = query(
          collection(db, "comments"),
          where("postId", "==", id),
          orderBy("createdAt", "desc"),
          firestoreLimit(20),
        )

        const commentsSnapshot = await getDocs(commentsQuery)
        const commentsData = await Promise.all(
          commentsSnapshot.docs.map(async (doc) => {
            const commentData = { id: doc.id, ...doc.data() }

            // Fetch comment author
            const commentAuthorDoc = await getDoc(doc(db, "users", commentData.userId))
            const commentAuthor = commentAuthorDoc.exists()
              ? { id: commentAuthorDoc.id, ...commentAuthorDoc.data() }
              : null

            return { ...commentData, author: commentAuthor }
          }),
        )

        setComments(commentsData)

        // Check if user has liked the post
        if (postData.likes && postData.likes.includes(user.uid)) {
          setLiked(true)
        }

        // Check if user has bookmarked the post
        const bookmarkQuery = query(
          collection(db, "bookmarks"),
          where("userId", "==", user.uid),
          where("postId", "==", id),
        )

        const bookmarkSnapshot = await getDocs(bookmarkQuery)
        setBookmarked(!bookmarkSnapshot.empty)

        setLoading(false)
      } catch (error) {
        console.error("Error fetching post:", error)
        setLoading(false)
      }
    }

    fetchPostData()
  }, [id, user, router])

  const handleLike = async () => {
    if (!user || !post) return

    try {
      const postRef = doc(db, "posts", post.id)
      const postDoc = await getDoc(postRef)
      const postData = postDoc.data()

      if (!postData) return

      const likes = postData.likes || []
      let newLikes

      if (likes.includes(user.uid)) {
        // Unlike
        newLikes = likes.filter((id: string) => id !== user.uid)
        await updateDoc(postRef, {
          likes: newLikes,
          likeCount: increment(-1),
        })
        setLiked(false)
      } else {
        // Like
        newLikes = [...likes, user.uid]
        await updateDoc(postRef, {
          likes: newLikes,
          likeCount: increment(1),
        })
        setLiked(true)

        // Create notification for post author if it's not the user's own post
        if (post.userId !== user.uid) {
          await addDoc(collection(db, "notifications"), {
            userId: post.userId,
            fromUserId: user.uid,
            type: "like",
            title: "New Like",
            message: `${user.displayName || "Someone"} liked your post`,
            link: `/post-detail?id=${post.id}`,
            read: false,
            createdAt: serverTimestamp(),
          })
        }
      }

      // Update post state
      setPost({ ...post, likes: newLikes, likeCount: newLikes.length })
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const handleBookmark = async () => {
    if (!user || !post) return

    try {
      const bookmarkQuery = query(
        collection(db, "bookmarks"),
        where("userId", "==", user.uid),
        where("postId", "==", post.id),
      )

      const bookmarkSnapshot = await getDocs(bookmarkQuery)

      if (!bookmarkSnapshot.empty) {
        // Remove bookmark
        const bookmarkDoc = bookmarkSnapshot.docs[0]
        await deleteDoc(doc(db, "bookmarks", bookmarkDoc.id))
        setBookmarked(false)
      } else {
        // Add bookmark
        await addDoc(collection(db, "bookmarks"), {
          userId: user.uid,
          postId: post.id,
          createdAt: serverTimestamp(),
        })
        setBookmarked(true)
      }
    } catch (error) {
      console.error("Error bookmarking post:", error)
    }
  }

  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/post-detail?id=${post.id}`

      if (navigator.share) {
        await navigator.share({
          title: post.text.substring(0, 50),
          text: `Check out this post on NexusSphere`,
          url: shareUrl,
        })
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl)
        alert("Link copied to clipboard!")
      }
    } catch (error) {
      console.error("Error sharing post:", error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !post || !commentText.trim() || submitting) return

    setSubmitting(true)

    try {
      // Add comment to database
      const commentRef = await addDoc(collection(db, "comments"), {
        postId: post.id,
        userId: user.uid,
        text: commentText.trim(),
        createdAt: serverTimestamp(),
        likes: [],
        likeCount: 0,
      })

      // Update post comment count
      await updateDoc(doc(db, "posts", post.id), {
        commentCount: increment(1),
      })

      // Create notification for post author if it's not the user's own post
      if (post.userId !== user.uid) {
        await addDoc(collection(db, "notifications"), {
          userId: post.userId,
          fromUserId: user.uid,
          type: "comment",
          title: "New Comment",
          message: `${user.displayName || "Someone"} commented on your post`,
          link: `/post-detail?id=${post.id}`,
          read: false,
          createdAt: serverTimestamp(),
        })
      }

      // Add new comment to state
      const newComment = {
        id: commentRef.id,
        postId: post.id,
        userId: user.uid,
        text: commentText.trim(),
        createdAt: new Date(),
        likes: [],
        likeCount: 0,
        author: {
          id: user.uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          username: user.username,
          verified: user.verified,
          verifiedType: user.verifiedType,
        },
      }

      setComments([newComment, ...comments])
      setCommentText("")

      // Update post state
      setPost({ ...post, commentCount: (post.commentCount || 0) + 1 })
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !post) return

    try {
      // Delete comment from database
      await deleteDoc(doc(db, "comments", commentId))

      // Update post comment count
      await updateDoc(doc(db, "posts", post.id), {
        commentCount: increment(-1),
      })

      // Remove comment from state
      setComments(comments.filter((comment) => comment.id !== commentId))

      // Update post state
      setPost({ ...post, commentCount: (post.commentCount || 0) - 1 })
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const handleLikeComment = async (commentId: string, isLiked: boolean) => {
    if (!user) return

    try {
      const commentRef = doc(db, "comments", commentId)
      const commentDoc = await getDoc(commentRef)
      const commentData = commentDoc.data()

      if (!commentData) return

      let likes = commentData.likes || []

      if (isLiked) {
        // Unlike
        likes = likes.filter((id: string) => id !== user.uid)
        await updateDoc(commentRef, {
          likes,
          likeCount: increment(-1),
        })
      } else {
        // Like
        likes = [...likes, user.uid]
        await updateDoc(commentRef, {
          likes,
          likeCount: increment(1),
        })

        // Create notification for comment author if it's not the user's own comment
        if (commentData.userId !== user.uid) {
          await addDoc(collection(db, "notifications"), {
            userId: commentData.userId,
            fromUserId: user.uid,
            type: "like",
            title: "Comment Like",
            message: `${user.displayName || "Someone"} liked your comment`,
            link: `/post-detail?id=${post.id}`,
            read: false,
            createdAt: serverTimestamp(),
          })
        }
      }

      // Update comments state
      setComments(
        comments.map((comment) =>
          comment.id === commentId ? { ...comment, likes, likeCount: likes.length } : comment,
        ),
      )
    } catch (error) {
      console.error("Error liking comment:", error)
    }
  }

  const handleReportPost = async () => {
    if (!user || !post || !reportReason.trim()) return

    try {
      await addDoc(collection(db, "reports"), {
        userId: user.uid,
        postId: post.id,
        reason: reportReason.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      })

      setShowReportModal(false)
      setReportReason("")
      alert("Report submitted successfully. Our team will review it shortly.")
    } catch (error) {
      console.error("Error reporting post:", error)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (!post || !author) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center">
          <AlertTriangle className="mb-4 h-16 w-16 text-yellow-500" />
          <h2 className="mb-2 text-xl font-semibold">Post not found</h2>
          <p className="mb-4 text-gray-500">The post you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push("/feed")}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Back to Feed
          </button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ChevronLeft className="mr-1 h-5 w-5" />
          Back
        </button>

        {/* Post card */}
        <div className="mb-8 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-gray-800">
          {/* Post header */}
          <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
            <div className="flex items-center">
              <div className="relative h-10 w-10 overflow-hidden rounded-full">
                {author.photoURL ? (
                  <Image
                    src={author.photoURL || "/placeholder.svg"}
                    alt={author.displayName || "User"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-300 text-gray-600">
                    <User className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="ml-3">
                <div className="flex items-center">
                  <span className="font-medium">{author.displayName || "Anonymous User"}</span>
                  {author.verified && <VerificationBadges type={author.verifiedType || "blue"} className="ml-1" />}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  @{author.username || "user"} •
                  {post.createdAt && <span> {new Date(post.createdAt.toDate()).toLocaleString()}</span>}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {user && user.uid === post.userId ? (
                  <>
                    <DropdownMenuItem onClick={() => router.push(`/edit-post?id=${post.id}`)}>
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
                          // Delete post logic
                        }
                      }}
                    >
                      Delete Post
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => setShowReportModal(true)}>Report Post</DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post content */}
          <div className="p-4">
            <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{post.text}</p>

            {post.mediaUrl && (
              <div className="mt-4 overflow-hidden rounded-lg">
                {post.mediaType === "image" ? (
                  <Image
                    src={post.mediaUrl || "/placeholder.svg"}
                    alt="Post media"
                    width={600}
                    height={400}
                    className="h-auto w-full object-cover"
                  />
                ) : post.mediaType === "video" ? (
                  <video src={post.mediaUrl} controls className="h-auto w-full" />
                ) : null}
              </div>
            )}

            {/* Post stats */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div>
                {post.likeCount > 0 && (
                  <span>
                    {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
                  </span>
                )}
              </div>
              <div>
                {post.commentCount > 0 && (
                  <span>
                    {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Post actions */}
          <div className="flex border-t border-b p-2 dark:border-gray-700">
            <button
              onClick={handleLike}
              className={`flex flex-1 items-center justify-center rounded-md p-2 ${
                liked
                  ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              <Heart className={`mr-2 h-5 w-5 ${liked ? "fill-current" : ""}`} />
              Like
            </button>

            <button
              onClick={() => document.getElementById("comment-input")?.focus()}
              className="flex flex-1 items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Comment
            </button>

            <button
              onClick={handleShare}
              className="flex flex-1 items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Share
            </button>

            <button
              onClick={handleBookmark}
              className={`flex flex-1 items-center justify-center rounded-md p-2 ${
                bookmarked
                  ? "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              <Bookmark className={`mr-2 h-5 w-5 ${bookmarked ? "fill-current" : ""}`} />
              Save
            </button>
          </div>

          {/* Comment form */}
          <div className="p-4">
            <form onSubmit={handleSubmitComment} className="flex items-start space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || "User"} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <Textarea
                  id="comment-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="min-h-[80px] w-full resize-none"
                />

                <div className="mt-2 flex justify-end">
                  <Button type="submit" disabled={!commentText.trim() || submitting} className="flex items-center">
                    {submitting ? "Posting..." : "Post Comment"}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Comments section */}
          <div className="border-t dark:border-gray-700">
            <h3 className="p-4 text-lg font-semibold">Comments ({post.commentCount || 0})</h3>

            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="mb-2 h-10 w-10 text-gray-400" />
                <p className="text-gray-500">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="relative h-8 w-8 overflow-hidden rounded-full">
                          {comment.author?.photoURL ? (
                            <Image
                              src={comment.author.photoURL || "/placeholder.svg"}
                              alt={comment.author.displayName || "User"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-300 text-gray-600">
                              <User className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center">
                            <span className="font-medium">{comment.author?.displayName || "Anonymous User"}</span>
                            {comment.author?.verified && (
                              <VerificationBadges type={comment.author.verifiedType || "blue"} className="ml-1" />
                            )}
                          </div>

                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            @{comment.author?.username || "user"} •
                            {comment.createdAt && <span> {new Date(comment.createdAt.toDate()).toLocaleString()}</span>}
                          </div>

                          <p className="mt-2 whitespace-pre-wrap text-gray-800 dark:text-gray-200">{comment.text}</p>

                          <div className="mt-2 flex items-center space-x-4">
                            <button
                              onClick={() => handleLikeComment(comment.id, comment.likes?.includes(user?.uid))}
                              className={`flex items-center text-xs ${
                                comment.likes?.includes(user?.uid)
                                  ? "text-blue-500"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              <ThumbsUp
                                className={`mr-1 h-4 w-4 ${comment.likes?.includes(user?.uid) ? "fill-current" : ""}`}
                              />
                              {comment.likeCount || 0}
                            </button>

                            <span className="text-xs text-gray-500 dark:text-gray-400">Reply</span>
                          </div>
                        </div>
                      </div>

                      {user && (user.uid === comment.userId || user.uid === post.userId) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-600">
                              <MoreHorizontal className="h-4 w-4 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.uid === comment.userId && (
                              <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this comment?")) {
                                    handleDeleteComment(comment.id)
                                  }
                                }}
                              >
                                Delete Comment
                              </DropdownMenuItem>
                            )}
                            {user.uid === post.userId && user.uid !== comment.userId && (
                              <DropdownMenuItem
                                className="text-red-500 focus:text-red-500"
                                onClick={() => {
                                  if (confirm("Are you sure you want to remove this comment from your post?")) {
                                    handleDeleteComment(comment.id)
                                  }
                                }}
                              >
                                Remove Comment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Report modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
              <h3 className="mb-4 text-xl font-bold">Report Post</h3>

              <p className="mb-4 text-gray-600 dark:text-gray-300">
                Please tell us why you're reporting this post. This report will be sent to our moderation team for
                review.
              </p>

              <Textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Explain why you're reporting this post..."
                className="mb-4 min-h-[100px]"
              />

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReportModal(false)
                    setReportReason("")
                  }}
                >
                  Cancel
                </Button>

                <Button
                  onClick={handleReportPost}
                  disabled={!reportReason.trim()}
                  className="bg-red-500 text-white hover:bg-red-600"
                >
                  Submit Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
