"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Loader } from "@/components/ui/loader"
import { useAppStore } from "@/lib/store"

export default function Feed() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState([])
  const { setIsComposingPost } = useAppStore()

  useEffect(() => {
    // Simulate loading posts
    const timer = setTimeout(() => {
      setPosts([])
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Home</h1>
        <Button onClick={() => setIsComposingPost(true)}>New Post</Button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <h3 className="font-medium text-lg">Welcome to your feed!</h3>
          <p className="text-muted-foreground mt-1">
            Start by creating a post or following other users to see their content here.
          </p>
          <Button className="mt-4" onClick={() => setIsComposingPost(true)}>
            Create Your First Post
          </Button>
        </div>
      ) : (
        <div className="space-y-4">{/* Posts would be mapped here */}</div>
      )}
    </div>
  )
}
