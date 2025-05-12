"use client"

import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useAuth, type UserProfile } from "@/lib/auth-provider"
import axios from "axios"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, Trophy, Star, Flame, Zap, Target, Calendar, Lock, CheckCircle2, Users, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Define achievement category types
type AchievementCategory = "engagement" | "social" | "content" | "streaks" | "special"

// Achievement interface
interface Achievement {
  id: string
  name: string
  description: string
  icon: JSX.Element
  category: AchievementCategory
  level: number
  maxLevel: number
  progress: number
  maxProgress: number
  unlockedAt?: string
  isLocked: boolean
}

// Achievement category metadata
const categoryInfo = {
  engagement: {
    name: "Engagement",
    description: "Achievements earned through platform interaction",
    icon: <Zap className="h-5 w-5" />,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  social: {
    name: "Social",
    description: "Achievements earned through connecting with others",
    icon: <Users className="h-5 w-5" />,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  content: {
    name: "Content",
    description: "Achievements earned through creating posts and media",
    icon: <Star className="h-5 w-5" />,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  streaks: {
    name: "Streaks",
    description: "Achievements earned through daily activity",
    icon: <Flame className="h-5 w-5" />,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  special: {
    name: "Special",
    description: "Rare and exclusive achievements",
    icon: <Award className="h-5 w-5" />,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
}

export default function Achievements() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()
  const { toast } = useToast()
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | "all">("all")

  const isOwnProfile = !username || user?.username === username

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)

        // If no username is provided or it's the current user's profile, use current user data
        if (!username || (user && user.username === username)) {
          setProfileUser(user)
        } else {
          // Fetch other user's profile data
          const response = await axios.get(`/api/users/username/${username}`)
          setProfileUser(response.data)
        }

        // Once we have the user ID, fetch achievements
        const userId = !username || (user && user.username === username) ? user?.uid : profileUser?.uid
        if (userId) {
          await fetchAchievements(userId)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [username, user, profileUser])

  const fetchAchievements = async (userId: string) => {
    try {
      // Simulated API call - In production, replace with actual API call
      // const response = await axios.get(`/api/achievements/${userId}`)
      // setAchievements(response.data)

      // Simulating API response with mock data
      // In a real app, this would come from your backend
      setTimeout(() => {
        const mockAchievements: Achievement[] = [
          {
            id: "engage-1",
            name: "First Steps",
            description: "Log in to the platform 5 days in a row",
            icon: <Calendar className="h-5 w-5" />,
            category: "engagement",
            level: 1,
            maxLevel: 3,
            progress: 5,
            maxProgress: 5,
            unlockedAt: new Date().toISOString(),
            isLocked: false,
          },
          {
            id: "engage-2",
            name: "Explorer",
            description: "Visit at least 10 different sections of the app",
            icon: <Target className="h-5 w-5" />,
            category: "engagement",
            level: 2,
            maxLevel: 3,
            progress: 8,
            maxProgress: 10,
            isLocked: false,
          },
          {
            id: "social-1",
            name: "Networker",
            description: "Connect with 5 other users",
            icon: <Users className="h-5 w-5" />,
            category: "social",
            level: 1,
            maxLevel: 5,
            progress: 5,
            maxProgress: 5,
            unlockedAt: new Date().toISOString(),
            isLocked: false,
          },
          {
            id: "social-2",
            name: "Community Builder",
            description: "Have 25 followers",
            icon: <Users className="h-5 w-5" />,
            category: "social",
            level: 2,
            maxLevel: 5,
            progress: 15,
            maxProgress: 25,
            isLocked: false,
          },
          {
            id: "content-1",
            name: "Creator",
            description: "Create your first post",
            icon: <Star className="h-5 w-5" />,
            category: "content",
            level: 1,
            maxLevel: 5,
            progress: 1,
            maxProgress: 1,
            unlockedAt: new Date().toISOString(),
            isLocked: false,
          },
          {
            id: "content-2",
            name: "Media Master",
            description: "Upload 10 images or videos",
            icon: <Share2 className="h-5 w-5" />,
            category: "content",
            level: 2,
            maxLevel: 5,
            progress: 5,
            maxProgress: 10,
            isLocked: false,
          },
          {
            id: "streak-1",
            name: "Momentum",
            description: "Maintain a 7-day activity streak",
            icon: <Flame className="h-5 w-5" />,
            category: "streaks",
            level: 1,
            maxLevel: 4,
            progress: 7,
            maxProgress: 7,
            unlockedAt: new Date().toISOString(),
            isLocked: false,
          },
          {
            id: "streak-2",
            name: "Committed",
            description: "Maintain a 30-day activity streak",
            icon: <Flame className="h-5 w-5" />,
            category: "streaks",
            level: 2,
            maxLevel: 4,
            progress: 22,
            maxProgress: 30,
            isLocked: false,
          },
          {
            id: "special-1",
            name: "Early Adopter",
            description: "Join during the platform's beta phase",
            icon: <Award className="h-5 w-5" />,
            category: "special",
            level: 1,
            maxLevel: 1,
            progress: 1,
            maxProgress: 1,
            unlockedAt: new Date().toISOString(),
            isLocked: false,
          },
          {
            id: "special-2",
            name: "Premium Supporter",
            description: "Subscribe to premium for 3 months",
            icon: <Trophy className="h-5 w-5" />,
            category: "special",
            level: 1,
            maxLevel: 3,
            progress: 0,
            maxProgress: 3,
            isLocked: true,
          },
        ]

        setAchievements(mockAchievements)
      }, 1000) // Simulate network delay
    } catch (error) {
      console.error("Error fetching achievements:", error)
      toast({
        title: "Error",
        description: "Failed to load achievements",
        variant: "destructive",
      })
    }
  }

  const filteredAchievements = achievements.filter(
    (achievement) => activeCategory === "all" || achievement.category === activeCategory,
  )

  const unlockedAchievements = achievements.filter((achievement) => !achievement.isLocked)
  const totalAchievements = achievements.length
  const completionPercentage = Math.round((unlockedAchievements.length / totalAchievements) * 100) || 0

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-20 w-full" />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            {isOwnProfile ? "My Achievements" : `${profileUser?.displayName}'s Achievements`}
          </h1>
          <p className="text-muted-foreground">Track your progress and unlock rewards by completing these challenges</p>
        </div>

        {isOwnProfile && (
          <Button variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share Achievements
          </Button>
        )}
      </div>

      {/* Achievement stats card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h2 className="text-xl font-bold">Achievement Progress</h2>
              <p className="text-sm text-muted-foreground">
                You've unlocked {unlockedAchievements.length} of {totalAchievements} achievements
              </p>
              <div className="flex items-center gap-2">
                <Progress value={completionPercentage} className="h-2" />
                <span className="text-sm font-medium">{completionPercentage}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-3xl font-bold">{unlockedAchievements.length}</div>
                <p className="text-xs text-muted-foreground">Unlocked</p>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">{achievements.filter((a) => a.level > 1).length}</div>
                <p className="text-xs text-muted-foreground">Leveled Up</p>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold">
                  {achievements.filter((a) => a.category === "special" && !a.isLocked).length}
                </div>
                <p className="text-xs text-muted-foreground">Special</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievement categories */}
      <Tabs defaultValue="all" value={activeCategory} onValueChange={(value) => setActiveCategory(value as any)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            <span>All</span>
          </TabsTrigger>
          {Object.entries(categoryInfo).map(([key, category]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-1">
              {category.icon}
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAchievements.map((achievement) => {
            const category = categoryInfo[achievement.category]
            return (
              <Card key={achievement.id} className={`border ${achievement.isLocked ? "opacity-70" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className={`p-2 rounded-lg ${category.bgColor} ${category.color}`}>{achievement.icon}</div>
                    <div className="flex items-center gap-1">
                      {achievement.isLocked ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <Badge variant={achievement.isLocked ? "outline" : "default"}>
                        Level {achievement.level}/{achievement.maxLevel}
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{achievement.name}</CardTitle>
                  <CardDescription>{achievement.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {achievement.progress}/{achievement.maxProgress}
                      </span>
                    </div>
                    <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
                    <span>{category.name}</span>
                    {achievement.unlockedAt && (
                      <span>Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </Tabs>
    </div>
  )
}
