"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-provider"
import { collection, query, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { UserProfile } from "@/lib/auth-provider"
import { TrendingUp, Users } from "lucide-react"

export default function RightSidebar() {
  const { user } = useAuth()
  const [trendingTopics, setTrendingTopics] = useState<string[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      try {
        setLoading(true)
        const usersRef = collection(db, "users")
        const q = query(usersRef, limit(5))
        const querySnapshot = await getDocs(q)

        const users: UserProfile[] = []
        querySnapshot.forEach((doc) => {
          const userData = doc.data() as UserProfile
          // Don't suggest the current user
          if (userData.uid !== user?.uid) {
            users.push(userData)
          }
        })

        setSuggestedUsers(users)

        // Mock trending topics
        setTrendingTopics(["#NexusSphere", "#WebDevelopment", "#ReactJS", "#TypeScript", "#AI"])
      } catch (error) {
        console.error("Error fetching suggested users:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchSuggestedUsers()
    }
  }, [user])

  return (
    <div className="w-72 h-screen sticky top-0 p-4 space-y-6 overflow-y-auto">
      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-full bg-muted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Trending topics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Trending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading
            ? Array(5)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
            : trendingTopics.map((topic, index) => (
                <div key={index} className="text-sm hover:text-primary cursor-pointer">
                  {topic}
                </div>
              ))}
        </CardContent>
      </Card>

      {/* Suggested users */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Who to follow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading
            ? Array(3)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded-md" />
                  </div>
                ))
            : suggestedUsers.map((suggestedUser) => (
                <div key={suggestedUser.uid} className="flex items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={suggestedUser.photoURL || "/placeholder.svg"} alt={suggestedUser.displayName} />
                    <AvatarFallback>{suggestedUser.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/profile/${suggestedUser.username}`}
                      className="font-medium text-sm hover:underline truncate block"
                    >
                      {suggestedUser.displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">@{suggestedUser.username}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Follow
                  </Button>
                </div>
              ))}
        </CardContent>
      </Card>
    </div>
  )
}
