"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/layouts/main-layout"
import { useAuth } from "@/lib/auth-provider"
import { Loader } from "@/components/ui/loader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Share, Copy, Gift, Award, Users, Sparkles, Trophy, ChevronRight, Check } from "lucide-react"
import { ReferralShareModal } from "@/components/referral/referral-share-modal"

export default function Referrals() {
  const { user, generateReferralCode, getReferralStats, claimReferralReward } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [claimingReward, setClaimingReward] = useState<string | null>(null)

  useEffect(() => {
    const fetchReferralStats = async () => {
      if (!user) return

      try {
        const stats = await getReferralStats()
        setStats(stats)
      } catch (error) {
        console.error("Error fetching referral stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchReferralStats()
  }, [user, getReferralStats])

  const handleGenerateCode = async () => {
    try {
      const code = await generateReferralCode()
      setStats((prev) => ({
        ...prev,
        hasReferralCode: true,
        referralCode: code,
      }))

      toast({
        title: "Referral Code Generated",
        description: "Your unique referral code has been created!",
      })
    } catch (error) {
      console.error("Error generating code:", error)
    }
  }

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${stats.referralCode}`
    navigator.clipboard.writeText(referralLink)

    toast({
      title: "Link Copied",
      description: "Referral link copied to clipboard!",
    })
  }

  const handleClaimReward = async (rewardId: string) => {
    try {
      setClaimingReward(rewardId)
      await claimReferralReward(rewardId)

      // Update local state to mark reward as claimed
      setStats((prev) => ({
        ...prev,
        rewards: prev.rewards.map((reward: any) =>
          reward._id === rewardId ? { ...reward, claimed: true, claimedAt: new Date().toISOString() } : reward,
        ),
      }))
    } catch (error) {
      console.error("Error claiming reward:", error)
    } finally {
      setClaimingReward(null)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[70vh]">
          <Loader size="large" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
        <p className="text-muted-foreground mb-6">Invite friends and earn rewards!</p>

        {!stats?.hasReferralCode ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Get Started with Referrals</CardTitle>
              <CardDescription>Generate your unique referral code to start inviting friends</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="bg-primary/10 p-6 rounded-full mb-6">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Referral Code Yet</h3>
              <p className="text-center text-muted-foreground mb-6 max-w-md">
                Generate your unique referral code to start inviting friends and earning rewards. Each successful
                referral brings you closer to exclusive benefits!
              </p>
              <Button onClick={handleGenerateCode} size="lg">
                Generate My Referral Code
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Your Referral Code</h2>
                    <p className="text-muted-foreground mb-4">Share this code with friends to earn rewards</p>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative">
                        <Input
                          value={stats.referralCode}
                          readOnly
                          className="pr-10 font-mono text-base bg-background/80 border-primary/20"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={copyReferralLink}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button onClick={() => setIsShareModalOpen(true)}>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-center bg-background/80 p-4 rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Referrals</span>
                    <span className="text-4xl font-bold text-primary">{stats.referralCount}</span>
                  </div>
                </div>
              </div>

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-5 w-5 text-primary" />
                      <span className="font-medium">Total Tokens</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.totalRewards.tokens}</span>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <span className="font-medium">Premium Days</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.totalRewards.premiumDays}</span>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span className="font-medium">XP Earned</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.totalRewards.xp}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Referral Milestones</h3>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">First Referral</span>
                        <span className="text-sm font-medium">{Math.min(stats.referralCount, 1)}/1</span>
                      </div>
                      <Progress value={Math.min(stats.referralCount, 1) * 100} className="h-2" />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">20 Tokens</span>
                        {stats.referralCount >= 1 && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            <Check className="h-3 w-3 mr-1" /> Unlocked
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">5 Referrals</span>
                        <span className="text-sm font-medium">{Math.min(stats.referralCount, 5)}/5</span>
                      </div>
                      <Progress value={Math.min(stats.referralCount, 5) * 20} className="h-2" />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">50 Tokens + 100 XP</span>
                        {stats.referralCount >= 5 && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            <Check className="h-3 w-3 mr-1" /> Unlocked
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">10 Referrals</span>
                        <span className="text-sm font-medium">{Math.min(stats.referralCount, 10)}/10</span>
                      </div>
                      <Progress value={Math.min(stats.referralCount, 10) * 10} className="h-2" />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">100 Tokens + 7 Days Premium</span>
                        {stats.referralCount >= 10 && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            <Check className="h-3 w-3 mr-1" /> Unlocked
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">25 Referrals</span>
                        <span className="text-sm font-medium">{Math.min(stats.referralCount, 25)}/25</span>
                      </div>
                      <Progress value={Math.min(stats.referralCount, 25) * 4} className="h-2" />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          250 Tokens + 30 Days Premium + Special Badge
                        </span>
                        {stats.referralCount >= 25 && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            <Check className="h-3 w-3 mr-1" /> Unlocked
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="rewards" className="w-full">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="rewards" className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Available Rewards
                </TabsTrigger>
                <TabsTrigger value="referrals" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Your Referrals
                </TabsTrigger>
              </TabsList>

              <TabsContent value="rewards">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Rewards</CardTitle>
                    <CardDescription>Claim rewards you've earned from successful referrals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.rewards && stats.rewards.length > 0 ? (
                      <div className="space-y-4">
                        {stats.rewards.map((reward: any) => (
                          <div key={reward._id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {reward.type === "tokens" && <Gift className="h-5 w-5 text-primary" />}
                              {reward.type === "premium" && <Sparkles className="h-5 w-5 text-primary" />}
                              {reward.type === "xp" && <Trophy className="h-5 w-5 text-primary" />}
                              {reward.type === "badge" && <Award className="h-5 w-5 text-primary" />}

                              <div>
                                <div className="font-medium">
                                  {reward.type === "tokens" && `${reward.amount} Tokens`}
                                  {reward.type === "premium" && `${reward.amount} Days Premium`}
                                  {reward.type === "xp" && `${reward.amount} XP`}
                                  {reward.type === "badge" && "Special Referral Badge"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {reward.claimed
                                    ? `Claimed on ${new Date(reward.claimedAt).toLocaleDateString()}`
                                    : "Ready to claim"}
                                </div>
                              </div>
                            </div>

                            {reward.claimed ? (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                <Check className="h-3 w-3 mr-1" /> Claimed
                              </Badge>
                            ) : (
                              <Button
                                onClick={() => handleClaimReward(reward._id)}
                                disabled={claimingReward === reward._id}
                              >
                                {claimingReward === reward._id ? <Loader size="small" className="mr-2" /> : null}
                                Claim Reward
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="bg-muted/50 p-6 rounded-full inline-block mb-4">
                          <Award className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No Rewards Yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Invite friends using your referral code to earn rewards. You'll see them here once they sign
                          up!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="referrals">
                <Card>
                  <CardHeader>
                    <CardTitle>People You've Referred</CardTitle>
                    <CardDescription>Users who have joined using your referral code</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {stats.referredUsers && stats.referredUsers.length > 0 ? (
                      <div className="space-y-4">
                        {stats.referredUsers.map((user: any) => (
                          <div key={user.uid} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.photoURL || "/placeholder.svg"} alt={user.displayName} />
                                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                              </Avatar>

                              <div>
                                <div className="font-medium">{user.displayName}</div>
                                <div className="text-sm text-muted-foreground">
                                  Joined {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <Button variant="ghost" size="sm">
                              View Profile
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="bg-muted/50 p-6 rounded-full inline-block mb-4">
                          <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">No Referrals Yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Share your referral code with friends to get them to join. They'll appear here once they sign
                          up!
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Referral Share Modal */}
        <ReferralShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          referralCode={stats?.referralCode || ""}
        />
      </div>
    </MainLayout>
  )
}
