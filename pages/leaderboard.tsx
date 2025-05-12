"use client"

import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth, type UserProfile } from "@/lib/auth-provider"
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Check, Flame, Trophy, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function Leaderboard() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("streak")
  const [streakLeaders, setStreakLeaders] = useState<UserProfile[]>([])
  const [levelLeaders, setLevelLeaders] = useState<UserProfile[]>([])
  const [followerLeaders, setFollowerLeaders] = useState<UserProfile[]>([])

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        setLoading(true)

        // Fetch streak leaders
        const streakQuery = query(collection(db, "users"), orderBy("streak", "desc"), limit(10))
        const streakSnapshot = await getDocs(streakQuery)
        const streakUsers = streakSnapshot.docs.map((doc) => doc.data() as UserProfile)
        setStreakLeaders(streakUsers)

        // Fetch level leaders
        const levelQuery = query(collection(db, "users"), orderBy("level", "desc"), limit(10))
        const levelSnapshot = await getDocs(levelQuery)
        const levelUsers = levelSnapshot.docs.map((doc) => doc.data() as UserProfile)
        setLevelLeaders(levelUsers)

        // Fetch follower leaders
        // This is a simplification - in a real app, you might need a more complex query
        // or a cloud function to calculate this
        const followerQuery = query(collection(db, "users"), orderBy("followers", "desc"), limit(10))
        const followerSnapshot = await getDocs(followerQuery)
        const followerUsers = followerSnapshot.docs.map((doc) => doc.data() as UserProfile)

        setFollowerLeaders(followerUsers)
      } catch (error) {
        console.error("Error fetching leaderboards:", error)
        toast({
          title: "Error",
          description: "Failed to load leaderboard data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboards()
  }, [])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  const renderLeaderboard = (leaders: UserProfile[], valueKey: "streak" | "level" | "followers") => {
    if (loading) {
      return Array(5)
        .fill(0)
        .map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border">
            <div className="flex-shrink-0 w-8 text-center font-bold">{i + 1}</div>
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24 mt-1" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))
    }

    return leaders.map((leader, index) => (
      <div
        key={leader.uid}
        className={`flex items-center gap-4 p-4 border-b border-border ${
          leader.uid === user?.uid ? "bg-primary/5" : ""
        }`}
      >
        <div className="flex-shrink-0 w-8 text-center font-bold">{index + 1}</div>
        <Link to={`/profile/${leader.username}`}>
          <Avatar>
            <AvatarImage src={leader.photoURL || "/placeholder.svg"} alt={leader.displayName} />
            <AvatarFallback>{leader.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${leader.username}`} className="font-medium truncate hover:underline">
              {leader.displayName}
            </Link>
            {leader.role === "verified" && (
              <Badge variant="outline" className="h-5 px-1 bg-primary/10 text-primary">
                <Check className="h-3 w-3 mr-1" />
                <span className="text-xs">Verified</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">@{leader.username}</p>
        </div>
        <div className="flex items-center gap-1 font-bold">
          {valueKey === "streak" && (
            <>
              <Flame className="h-4 w-4 text-orange-500" />
              <span>{leader.streak || 0}</span>
            </>
          )}
          {valueKey === "level" && (
            <>
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span>{leader.level || 1}</span>
            </>
          )}
          {valueKey === "followers" && (
            <>
              <Users className="h-4 w-4 text-blue-500" />
              <span>{leader.followers?.length || 0}</span>
            </>
          )}
        </div>
      </div>
    ))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Leaderboard</h1>

      <Tabs defaultValue="streak" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="streak">
            <Flame className="h-4 w-4 mr-2" />
            Streaks
          </TabsTrigger>
          <TabsTrigger value="level">
            <Trophy className="h-4 w-4 mr-2" />
            Levels
          </TabsTrigger>
          <TabsTrigger value="followers">
            <Users className="h-4 w-4 mr-2" />
            Followers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="streak" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Flame className="h-5 w-5 mr-2 text-orange-500" />
                Top Streaks
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">{renderLeaderboard(streakLeaders, "streak")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="level" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
                Top Levels
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">{renderLeaderboard(levelLeaders, "level")}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followers" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-500" />
                Most Followed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">{renderLeaderboard(followerLeaders, "followers")}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User's rank */}
      {user && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-bold">{user.streak || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Day Streak</p>
                {streakLeaders.findIndex((leader) => leader.uid === user.uid) > -1 && (
                  <Badge className="mt-2 bg-orange-500">
                    #{streakLeaders.findIndex((leader) => leader.uid === user.uid) + 1}
                  </Badge>
                )}
              </div>

              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-bold">{user.level || 1}</span>
                </div>
                <p className="text-xs text-muted-foreground">Level</p>
                {levelLeaders.findIndex((leader) => leader.uid === user.uid) > -1 && (
                  <Badge className="mt-2 bg-yellow-500">
                    #{levelLeaders.findIndex((leader) => leader.uid === user.uid) + 1}
                  </Badge>
                )}
              </div>

              <div className="bg-muted rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="font-bold">{user.followers?.length || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground">Followers</p>
                {followerLeaders.findIndex((leader) => leader.uid === user.uid) > -1 && (
                  <Badge className="mt-2 bg-blue-500">
                    #{followerLeaders.findIndex((leader) => leader.uid === user.uid) + 1}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
