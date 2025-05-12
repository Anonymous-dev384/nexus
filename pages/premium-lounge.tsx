"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import type { Post } from "@/lib/store"
import axios from "axios"
import PostCard from "@/components/post/post-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Crown, Gift, Users, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"

export default function PremiumLounge() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<Post[]>([])
  const [premiumUsers, setPremiumUsers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("feed")

  useEffect(() => {
    // Check if user has premium access
    if (user && !user.premiumFeatures?.isActive && user.role !== "premium") {
      toast({
        title: "Premium access required",
        description: "You need premium access to view this page",
        variant: "destructive",
      })
      navigate("/")
      return
    }

    fetchPremiumContent()
  }, [user])

  const fetchPremiumContent = async () => {
    try {
      setLoading(true)

      // Fetch premium posts
      const postsResponse = await axios.get("/api/posts/premium")
      setPosts(postsResponse.data)

      // Fetch premium users
      const usersResponse = await axios.get("/api/users/premium")
      setPremiumUsers(usersResponse.data)
    } catch (error) {
      console.error("Error fetching premium content:", error)
      toast({
        title: "Error",
        description: "Failed to load premium content",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user || (!user.premiumFeatures?.isActive && user.role !== "premium")) {
    return null // Redirect handled in useEffect
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-8 w-8 text-yellow-500" />
          <div>
            <h1 className="text-2xl font-bold">Premium Lounge</h1>
            <p className="text-muted-foreground">Exclusive content for premium members</p>
          </div>
        </div>

        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 px-3 py-1">
          <Crown className="h-4 w-4 mr-2" />
          Premium Member
        </Badge>
      </div>

      <Card className="bg-gradient-to-r from-yellow-500/5 to-purple-500/5 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Premium Benefits
          </CardTitle>
          <CardDescription>Enjoy these exclusive features as a premium member</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-2">
                <Gift className="h-5 w-5 text-yellow-500" />
              </div>
              <h3 className="font-medium">Exclusive Themes</h3>
              <p className="text-xs text-muted-foreground mt-1">Customize your profile with premium themes</p>
            </div>

            <div className="bg-background rounded-lg p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-2">
                <Users className="h-5 w-5 text-yellow-500" />
              </div>
              <h3 className="font-medium">Extended Threads</h3>
              <p className="text-xs text-muted-foreground mt-1">Create longer thread posts without limits</p>
            </div>

            <div className="bg-background rounded-lg p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-2">
                <Crown className="h-5 w-5 text-yellow-500" />
              </div>
              <h3 className="font-medium">Premium Lounge</h3>
              <p className="text-xs text-muted-foreground mt-1">Access exclusive premium-only content</p>
            </div>

            <div className="bg-background rounded-lg p-4 text-center">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <h3 className="font-medium">Pin More Posts</h3>
              <p className="text-xs text-muted-foreground mt-1">Pin up to 5 posts to your profile</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Premium active until:{" "}
            <span className="font-medium">
              {user.premiumFeatures?.expiresAt
                ? new Date(user.premiumFeatures.expiresAt).toLocaleDateString()
                : "Lifetime"}
            </span>
          </p>
        </CardFooter>
      </Card>

      <Tabs defaultValue="feed" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feed">Premium Feed</TabsTrigger>
          <TabsTrigger value="members">Premium Members</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No premium posts yet</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsComposingPost(true)}>
                Create the first premium post
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? (
              Array(8)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="space-y-2">
                      <div className="h-12 w-12 rounded-full bg-muted mx-auto" />
                      <div className="h-4 w-24 bg-muted mx-auto" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 w-full bg-muted mb-2" />
                      <div className="h-3 w-3/4 bg-muted" />
                    </CardContent>
                  </Card>
                ))
            ) : premiumUsers.length > 0 ? (
              premiumUsers.map((premiumUser) => (
                <Card key={premiumUser.uid}>
                  <CardHeader className="text-center pb-2">
                    <Avatar className="h-16 w-16 mx-auto">
                      <AvatarImage src={premiumUser.photoURL || "/placeholder.svg"} alt={premiumUser.displayName} />
                      <AvatarFallback>{premiumUser.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-lg mt-2">{premiumUser.displayName}</CardTitle>
                    <p className="text-sm text-muted-foreground">@{premiumUser.username}</p>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm line-clamp-2">{premiumUser.bio}</p>
                    <div className="flex justify-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        Level {premiumUser.level}
                      </Badge>
                      {premiumUser.titles && premiumUser.titles.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {premiumUser.titles[0]}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={`/profile/${premiumUser.username}`}>View Profile</a>
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No premium members found</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
