"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MainLayout } from "../layouts/main-layout"
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "../lib/firebase"
import { PostCard } from "../components/post/post-card"
import { Loader } from "../components/ui/loader"
import { Search, TrendingUp, Zap, Users, Hash } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

export default function Explore() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("trending")

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      try {
        let postsQuery

        switch (activeTab) {
          case "trending":
            postsQuery = query(collection(db, "posts"), orderBy("voteCount", "desc"), limit(20))
            break
          case "latest":
            postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(20))
            break
          case "popular":
            postsQuery = query(collection(db, "posts"), orderBy("commentCount", "desc"), limit(20))
            break
          default:
            postsQuery = query(collection(db, "posts"), orderBy("voteCount", "desc"), limit(20))
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
