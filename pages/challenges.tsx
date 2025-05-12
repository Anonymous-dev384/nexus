"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import axios from "axios"
import { format, isPast } from "date-fns"
import { Trophy, Award, Clock, Plus, CheckCircle, XCircle, AlertCircle, Swords, Target, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Loader } from "@/components/ui/loader"
import { useToast } from "@/hooks/use-toast"
import CreateChallengeModal from "@/components/challenges/create-challenge-modal"

interface Challenge {
  id: string
  title: string
  description: string
  creatorId: string
  creator: {
    displayName: string
    username: string
    photoURL: string
  }
  challengedUserId: string
  challengedUser: {
    displayName: string
    username: string
    photoURL: string
  }
  type: "post" | "media" | "activity" | "custom"
  criteria: {
    description: string
    deadline?: string
    mediaRequired?: boolean
    minLikes?: number
    hashtags?: string[]
  }
  status: "pending" | "accepted" | "completed" | "failed" | "declined"
  reward?: {
    tokens: number
    xp: number
  }
  createdAt: string
}

interface Quest {
  id: string
  title: string
  description: string
  type: "daily" | "weekly" | "achievement" | "special"
  difficulty: "easy" | "medium" | "hard" | "expert"
  requirements: {
    description: string
    type: string
    count: number
    progress?: number // Added for UI
  }[]
  rewards: {
    tokens: number
    xp: number
    badge?: string
    premium?: number
  }
  endDate?: string
  isActive: boolean
  isCompleted: boolean
  progress: number
}

export default function ChallengesPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [quests, setQuests] = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("quests")
  const [challengeTab, setChallengeTab] = useState("received")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch challenges
      const challengesResponse = await axios.get("/api/challenges")
      setChallenges(challengesResponse.data)

      // Fetch quests
      const questsResponse = await axios.get("/api/quests")
      setQuests(questsResponse.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load challenges and quests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChallengeAction = async (challengeId: string, action: "accept" | "decline" | "submit") => {
    try {
      await axios.post(`/api/challenges/${challengeId}/${action}`)

      // Update local state
      setChallenges((prevChallenges) =>
        prevChallenges.map((challenge) =>
          challenge.id === challengeId
            ? {
                ...challenge,
                status: action === "accept" ? "accepted" : action === "decline" ? "declined" : "completed",
              }
            : challenge,
        ),
      )

      toast({
        title: "Success",
        description: `Challenge ${
          action === "accept" ? "accepted" : action === "decline" ? "declined" : "submitted"
        } successfully`,
      })
    } catch (error) {
      console.error(`Error ${action}ing challenge:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} challenge`,
        variant: "destructive",
      })
    }
  }

  const handleQuestClaim = async (questId: string) => {
    try {
      const response = await axios.post(`/api/quests/${questId}/claim`)

      // Update local state
      setQuests((prevQuests) =>
        prevQuests.map((quest) => (quest.id === questId ? { ...quest, isCompleted: true } : quest)),
      )

      toast({
        title: "Rewards claimed!",
        description: `You received ${response.data.tokens} tokens and ${response.data.xp} XP`,
      })
    } catch (error) {
      console.error("Error claiming quest rewards:", error)
      toast({
        title: "Error",
        description: "Failed to claim rewards",
        variant: "destructive",
      })
    }
  }

  const getFilteredChallenges = () => {
    if (!challenges.length) return []

    return challenges.filter((challenge) => {
      if (challengeTab === "received") {
        return challenge.challengedUserId === user?.uid
      } else if (challengeTab === "sent") {
        return challenge.creatorId === user?.uid
      } else if (challengeTab === "completed") {
        return (
          (challenge.challengedUserId === user?.uid || challenge.creatorId === user?.uid) &&
          challenge.status === "completed"
        )
      }
      return false
    })
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "hard":
        return "bg-orange-500"
      case "expert":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500"
      case "accepted":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "failed":
        return "bg-red-500"
      case "declined":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-4 w-4" />
      case "accepted":
        return <CheckCircle className="h-4 w-4" />
      case "completed":
        return <Trophy className="h-4 w-4" />
      case "failed":
        return <XCircle className="h-4 w-4" />
      case "declined":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const filteredChallenges = getFilteredChallenges()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Challenges & Quests</h1>
          <p className="text-muted-foreground">Complete quests and challenge friends to earn rewards</p>
        </div>

        {activeTab === "challenges" && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Challenge
          </Button>
        )}
      </div>

      <Tabs defaultValue="quests" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quests">Quests</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="quests" className="space-y-4 mt-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : quests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quests.map((quest) => (
                <Card key={quest.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold">{quest.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {quest.type.charAt(0).toUpperCase() + quest.type.slice(1)}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getDifficultyColor(quest.difficulty)} bg-opacity-10 border-opacity-30`}
                          >
                            {quest.difficulty.charAt(0).toUpperCase() + quest.difficulty.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      {quest.endDate && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {isPast(new Date(quest.endDate))
                            ? "Expired"
                            : `Ends ${format(new Date(quest.endDate), "MMM d")}`}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pb-2">
                    <p className="text-sm mb-4">{quest.description}</p>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span>Progress</span>
                        <span>{Math.round(quest.progress)}%</span>
                      </div>
                      <Progress value={quest.progress} className="h-2" />

                      <div className="space-y-2 mt-3">
                        {quest.requirements.map((req, index) => (
                          <div key={index} className="flex justify-between items-center text-xs">
                            <span>{req.description}</span>
                            <span className="font-medium">
                              {req.progress || 0}/{req.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col pt-0">
                    <Separator className="my-3" />

                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Gift className="h-4 w-4 mr-1 text-yellow-500" />
                          <span className="text-sm font-medium">{quest.rewards.tokens}</span>
                        </div>

                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-1 text-purple-500" />
                          <span className="text-sm font-medium">{quest.rewards.xp} XP</span>
                        </div>

                        {quest.rewards.premium && (
                          <div className="flex items-center">
                            <Trophy className="h-4 w-4 mr-1 text-blue-500" />
                            <span className="text-sm font-medium">{quest.rewards.premium}d</span>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        disabled={quest.progress < 100 || quest.isCompleted}
                        onClick={() => handleQuestClaim(quest.id)}
                      >
                        {quest.isCompleted ? "Claimed" : "Claim"}
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Target className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-medium">No quests available</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Check back later for new quests to complete and earn rewards.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4 mt-4">
          <Tabs defaultValue="received" className="w-full" onValueChange={setChallengeTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="received">Received</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader size="lg" />
                </div>
              ) : filteredChallenges.length > 0 ? (
                <div className="space-y-4">
                  {filteredChallenges.map((challenge) => (
                    <Card key={challenge.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold">{challenge.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={`text-xs ${getStatusColor(challenge.status)} bg-opacity-10 border-opacity-30 flex items-center gap-1`}
                              >
                                {getStatusIcon(challenge.status)}
                                {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                              </Badge>

                              <Badge variant="outline" className="text-xs">
                                {challenge.type.charAt(0).toUpperCase() + challenge.type.slice(1)}
                              </Badge>
                            </div>
                          </div>

                          {challenge.criteria.deadline && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {isPast(new Date(challenge.criteria.deadline))
                                ? "Expired"
                                : `Due ${format(new Date(challenge.criteria.deadline), "MMM d")}`}
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent>
                        <p className="text-sm mb-4">{challenge.description}</p>

                        <div className="bg-muted p-3 rounded-md text-sm">
                          <h4 className="font-medium mb-1">Challenge Criteria:</h4>
                          <p>{challenge.criteria.description}</p>

                          {challenge.criteria.hashtags && challenge.criteria.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {challenge.criteria.hashtags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center mt-4 gap-4">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">From:</span>
                            <div className="flex items-center">
                              <img
                                src={challenge.creator.photoURL || "/placeholder.svg"}
                                alt={challenge.creator.displayName}
                                className="h-5 w-5 rounded-full mr-1"
                              />
                              <span className="text-sm">@{challenge.creator.username}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">To:</span>
                            <div className="flex items-center">
                              <img
                                src={challenge.challengedUser.photoURL || "/placeholder.svg"}
                                alt={challenge.challengedUser.displayName}
                                className="h-5 w-5 rounded-full mr-1"
                              />
                              <span className="text-sm">@{challenge.challengedUser.username}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>

                      <CardFooter className="flex flex-col pt-0">
                        <Separator className="my-3" />

                        <div className="flex justify-between items-center w-full">
                          {challenge.reward && (
                            <div className="flex items-center gap-2">
                              {challenge.reward.tokens > 0 && (
                                <div className="flex items-center">
                                  <Gift className="h-4 w-4 mr-1 text-yellow-500" />
                                  <span className="text-sm font-medium">{challenge.reward.tokens}</span>
                                </div>
                              )}

                              {challenge.reward.xp > 0 && (
                                <div className="flex items-center">
                                  <Award className="h-4 w-4 mr-1 text-purple-500" />
                                  <span className="text-sm font-medium">{challenge.reward.xp} XP</span>
                                </div>
                              )}
                            </div>
                          )}

                          {challenge.challengedUserId === user?.uid && challenge.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleChallengeAction(challenge.id, "decline")}
                              >
                                Decline
                              </Button>
                              <Button size="sm" onClick={() => handleChallengeAction(challenge.id, "accept")}>
                                Accept
                              </Button>
                            </div>
                          )}

                          {challenge.challengedUserId === user?.uid && challenge.status === "accepted" && (
                            <Button size="sm" onClick={() => handleChallengeAction(challenge.id, "submit")}>
                              Submit Challenge
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-6 mb-4">
                    <Swords className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium">No challenges found</h3>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    {challengeTab === "received"
                      ? "You haven't received any challenges yet."
                      : challengeTab === "sent"
                        ? "You haven't sent any challenges yet."
                        : "You haven't completed any challenges yet."}
                  </p>
                  {challengeTab !== "completed" && (
                    <Button className="mt-4" onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Challenge
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Tabs>
        </TabsContent>
      </Tabs>

      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onChallengeCreated={(newChallenge) => {
          setChallenges((prev) => [newChallenge, ...prev])
          setIsCreateModalOpen(false)
        }}
      />
    </div>
  )
}
