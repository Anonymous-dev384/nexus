"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MainLayout } from "../layouts/main-layout"
import { collection, query, getDocs, orderBy, limit as firestoreLimit } from "firebase/firestore"
import { db, isFirebaseAvailable } from "../lib/firebase"
import { PostCard } from "../components/post/post-card"
import { Loader } from "../components/ui/loader"
import { Search, TrendingUp, Zap, Users, Hash, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Mock data for when Firebase is not available
const MOCK_POSTS = [
  {
    id: "mock-1",
    content: "This is a mock post for development and build purposes.",
    author: { displayName: "Demo User", photoURL: "/placeholder.svg?height=40&width=40" },
    createdAt: { toDate: () => new Date() },
    voteCount: 42,
    commentCount: 7,
    tags: ["#demo", "#development"],
  },
  {
    id: "mock-2",
    content: "Another mock post showing how the UI looks without Firebase.",
    author: { displayName: "Test Account", photoURL: "/placeholder.svg?height=40&width=40" },
    createdAt: { toDate: () => new Date(Date.now() - 3600000) },
    voteCount: 15,
    commentCount: 3,
    tags: ["#test", "#ui"],
  },
]

export default function Explore() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("trending")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      setError(null)

      try {
        // Check if Firebase is available
        if (!isFirebaseAvailable()) {
          console.log("Firebase not available, using mock data")
          setPosts(MOCK_POSTS)
          setLoading(false)
          return
        }

        let postsQuery

        switch (activeTab) {
          case "trending":
            postsQuery = query(collection(db, "posts"), orderBy("voteCount", "desc"), firestoreLimit(20))
            break
          case "latest":
            postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"), firestoreLimit(20))
            break
          case "popular":
            postsQuery = query(collection(db, "posts"), orderBy("commentCount", "desc"), firestoreLimit(20))
            break
          default:
            postsQuery = query(collection(db, "posts"), orderBy("voteCount", "desc"), firestoreLimit(20))
        }

        const querySnapshot = await getDocs(postsQuery)
        const fetchedPosts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Filter by search query if it exists
        const filteredPosts = searchQuery
          ? fetchedPosts.filter(
              (post) =>
                post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.author?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
            )
          : fetchedPosts

        setPosts(filteredPosts)
      } catch (error) {
        console.error("Error fetching posts:", error)
        setError("Failed to load posts. Please try again later.")
        // Fallback to mock data in case of error
        setPosts(MOCK_POSTS)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [activeTab, searchQuery])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Explore</h1>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts, users, tags..."
              className="pl-8"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>
        </div>

        {!isFirebaseAvailable() && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Development Mode</AlertTitle>
            <AlertDescription>Firebase is not configured. Showing mock data for development purposes.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="trending" className="mb-6" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="latest" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Latest
            </TabsTrigger>
            <TabsTrigger value="popular" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Popular
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending">{renderPosts()}</TabsContent>
          <TabsContent value="latest">{renderPosts()}</TabsContent>
          <TabsContent value="popular">{renderPosts()}</TabsContent>
        </Tabs>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Hash className="mr-2 h-5 w-5" />
            Trending Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              "#futuristic",
              "#ai",
              "#metaverse",
              "#cyberpunk",
              "#tech",
              "#innovation",
              "#virtual",
              "#digital",
              "#augmented",
            ].map((tag) => (
              <Card key={tag} className="inline-block cursor-pointer hover:bg-accent transition-colors">
                <CardContent className="py-2 px-3">
                  <span className="font-medium">{tag}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )

  function renderPosts() {
    if (loading) {
      return (
        <div className="flex justify-center py-10">
          <Loader size="large" />
        </div>
      )
    }

    if (posts.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-muted-foreground">No posts found. Try a different search or category.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    )
  }
}
