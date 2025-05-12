"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import type { User, Session } from "@supabase/supabase-js"

export type UserRole = "user" | "verified" | "premium" | "admin"

export interface UserProfile {
  id: string
  username: string
  email: string
  display_name: string
  avatar_url: string
  bio: string
  role: UserRole
  verification_status: {
    verified: boolean
    earning_verified: boolean
  }
  streak: number
  last_post_date: string | null
  level: number
  xp: number
  badges: string[]
  titles: string[]
  following: string[]
  followers: string[]
  discord_id?: string
  discord_username?: string
  discord_avatar?: string
  discord_roles?: string[]
  status: "online" | "busy" | "offline"
  theme: "light" | "dark" | "system" | string
  created_at: string
  premium_features: {
    is_active: boolean
    expires_at: string | null
    exclusive_themes: boolean
    extended_threads: boolean
    premium_lounge_access: boolean
    max_pinned_posts: number
    gifter?: string
  }
  customization: {
    profile_color: string
    banner_image: string
    profile_skin?: string
  }
  achievements: {
    name: string
    unlocked_at: string
    icon: string
  }[]
  tokens: number
  pinned_posts: string[]
  referral_info?: {
    referral_code: string
    referred_by?: string
    referral_count: number
    last_referral_at?: string
  }
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, username: string, referralCode?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: (referralCode?: string) => Promise<void>
  signInWithDiscord: (referralCode?: string) => void
  handleDiscordCallback: (code: string, referralCode?: string) => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>
  updateUserStatus: (status: "online" | "busy" | "offline") => Promise<void>
  giftPremium: (userId: string, duration: number) => Promise<void>
  checkAchievements: () => Promise<void>
  generateReferralCode: () => Promise<string>
  getReferralStats: () => Promise<any>
  claimReferralReward: (rewardId: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Initialize user profile in database
  const initializeUserProfile = async (user: User, username = "", referralCode?: string) => {
    try {
      // Check if user profile exists in Supabase
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (fetchError || !existingProfile) {
        // Create new user profile
        const newProfile: Partial<UserProfile> = {
          id: user.id,
          username: username || user.email?.split("@")[0] || `user${Math.floor(Math.random() * 10000)}`,
          email: user.email || "",
          display_name: username || user.email?.split("@")[0] || "New User",
          avatar_url: user.user_metadata?.avatar_url || `/placeholder.svg?height=200&width=200`,
          bio: "Hello, I'm new to NexusSphere!",
          role: "user",
          verification_status: {
            verified: false,
            earning_verified: false,
          },
          streak: 0,
          last_post_date: null,
          level: 1,
          xp: 0,
          badges: ["newcomer"],
          titles: [],
          following: [],
          followers: [],
          status: "online",
          theme: "dark",
          created_at: new Date().toISOString(),
          premium_features: {
            is_active: false,
            expires_at: null,
            exclusive_themes: false,
            extended_threads: false,
            premium_lounge_access: false,
            max_pinned_posts: 1,
          },
          customization: {
            profile_color: "#7C3AED",
            banner_image: "",
          },
          achievements: [],
          tokens: 10, // Start with some tokens
          pinned_posts: [],
        }

        // If referral code is provided, add it to the user profile
        if (referralCode) {
          try {
            const { data: referralData, error: referralError } = await supabase
              .from("referrals")
              .select("user_id")
              .eq("code", referralCode)
              .single()

            if (!referralError && referralData) {
              newProfile.referral_info = {
                referral_code: "", // Will be generated later
                referred_by: referralData.user_id,
                referral_count: 0,
                last_referral_at: new Date().toISOString(),
              }
            }
          } catch (error) {
            console.error("Error validating referral code:", error)
          }
        }

        // Insert new profile
        const { data, error } = await supabase.from("profiles").insert([newProfile]).select()

        if (error) {
          throw error
        }

        // Generate a referral code for the new user
        try {
          const { data: referralData, error: referralError } = await supabase
            .from("referrals")
            .insert([{ user_id: user.id, code: generateRandomCode(8) }])
            .select()

          if (!referralError && referralData) {
            newProfile.referral_info = {
              ...newProfile.referral_info,
              referral_code: referralData[0].code,
              referral_count: 0,
            }
          }
        } catch (error) {
          console.error("Error generating referral code:", error)
        }

        setProfile(newProfile as UserProfile)
      } else {
        // User exists, update their status to online
        await supabase.from("profiles").update({ status: "online" }).eq("id", user.id)

        setProfile({ ...existingProfile, status: "online" })
      }
    } catch (error) {
      console.error("Error initializing user profile:", error)
      toast({
        title: "Error",
        description: "Failed to initialize user profile",
        variant: "destructive",
      })
    }
  }

  // Generate random code for referrals
  const generateRandomCode = (length: number) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string, username: string, referralCode?: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        await initializeUserProfile(data.user, username, referralCode)

        // Process referral if code was provided
        if (referralCode) {
          try {
            // Get referrer ID
            const { data: referralData, error: referralError } = await supabase
              .from("referrals")
              .select("user_id")
              .eq("code", referralCode)
              .single()

            if (!referralError && referralData) {
              // Record the referral
              await supabase.from("referral_uses").insert([
                {
                  referral_code: referralCode,
                  referred_user_id: data.user.id,
                  referrer_id: referralData.user_id,
                  created_at: new Date().toISOString(),
                },
              ])

              // Update referral count for referrer
              await supabase.rpc("increment_referral_count", {
                user_id_param: referralData.user_id,
              })

              toast({
                title: "Referral Successful",
                description: "You've been referred by a friend!",
              })
            }
          } catch (error) {
            console.error("Error processing referral:", error)
          }
        }

        toast({
          title: "Account created",
          description: "Welcome to NexusSphere!",
        })
      }
    } catch (error: any) {
      console.error("Sign up error:", error)
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      toast({
        title: "Welcome back!",
        description: "You've successfully logged in",
      })
    } catch (error: any) {
      console.error("Sign in error:", error)
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Sign in with Google
  const signInWithGoogle = async (referralCode?: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      // Store referral code in localStorage to use after redirect
      if (referralCode) {
        localStorage.setItem("referralCode", referralCode)
      }

      // Redirect happens automatically
    } catch (error: any) {
      console.error("Google sign in error:", error)
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Sign in with Discord
  const signInWithDiscord = (referralCode?: string) => {
    try {
      // Store referral code in localStorage to use after redirect
      if (referralCode) {
        localStorage.setItem("referralCode", referralCode)
      }

      supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      // Redirect happens automatically
    } catch (error: any) {
      console.error("Discord sign in error:", error)
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Handle Discord callback
  const handleDiscordCallback = async (code: string, referralCode?: string) => {
    try {
      setLoading(true)

      // This is handled by Supabase automatically
      // We just need to update the user profile with Discord info

      if (user) {
        // Get Discord data from user.identities
        const discordIdentity = user.identities?.find((identity) => identity.provider === "discord")

        if (discordIdentity) {
          const discordData = discordIdentity.identity_data

          // Update profile with Discord info
          await supabase
            .from("profiles")
            .update({
              discord_id: discordData.id,
              discord_username: discordData.username,
              discord_avatar: discordData.avatar
                ? `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png`
                : undefined,
              // Discord roles would need to be fetched separately using the Discord API
            })
            .eq("id", user.id)

          // Update local profile state
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  discord_id: discordData.id,
                  discord_username: discordData.username,
                  discord_avatar: discordData.avatar
                    ? `https://cdn.discordapp.com/avatars/${discordData.id}/${discordData.avatar}.png`
                    : undefined,
                }
              : null,
          )

          toast({
            title: "Discord connected",
            description: "Your Discord account has been linked successfully",
          })
        }
      } else {
        toast({
          title: "Authentication required",
          description: "Please login first before connecting Discord",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Discord callback error:", error)
      toast({
        title: "Discord connection failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Logout
  const logout = async () => {
    try {
      if (user) {
        // Update user status to offline
        await supabase.from("profiles").update({ status: "offline" }).eq("id", user.id)
      }

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUser(null)
      setProfile(null)
      setSession(null)

      toast({
        title: "Logged out",
        description: "You've been successfully logged out",
      })
    } catch (error: any) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error("No user logged in")

      const { error } = await supabase.from("profiles").update(data).eq("id", user.id)

      if (error) throw error

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...data } : null))

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Update user status
  const updateUserStatus = async (status: "online" | "busy" | "offline") => {
    try {
      if (!user) throw new Error("No user logged in")

      const { error } = await supabase.from("profiles").update({ status }).eq("id", user.id)

      if (error) throw error

      // Update local state
      setProfile((prev) => (prev ? { ...prev, status } : null))
    } catch (error: any) {
      console.error("Status update error:", error)
      toast({
        title: "Status update failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Gift premium to another user
  const giftPremium = async (userId: string, duration: number) => {
    try {
      if (!user) throw new Error("No user logged in")
      if (!profile) throw new Error("No profile loaded")

      if (profile.tokens < duration) {
        toast({
          title: "Insufficient tokens",
          description: `You need ${duration} tokens to gift ${duration} days of premium`,
          variant: "destructive",
        })
        return
      }

      // Call RPC function to handle the premium gifting transaction
      const { data, error } = await supabase.rpc("gift_premium", {
        gifter_id: user.id,
        recipient_id: userId,
        duration_days: duration,
      })

      if (error) throw error

      // Update local state for tokens
      setProfile((prev) => (prev ? { ...prev, tokens: prev.tokens - duration } : null))

      toast({
        title: "Premium gifted",
        description: `You've successfully gifted ${duration} days of premium`,
      })
    } catch (error: any) {
      console.error("Gift premium error:", error)
      toast({
        title: "Gift failed",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  // Check for achievements
  const checkAchievements = async () => {
    try {
      if (!user) return

      const { data, error } = await supabase.rpc("check_achievements", {
        user_id_param: user.id,
      })

      if (error) throw error

      if (data && data.new_achievements && data.new_achievements.length > 0) {
        // Update local user state with new achievements
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                achievements: [...prev.achievements, ...data.new_achievements],
              }
            : null,
        )

        // Show notification for each new achievement
        data.new_achievements.forEach((achievement: any) => {
          toast({
            title: "Achievement Unlocked!",
            description: `You've earned: ${achievement.name}`,
          })
        })
      }
    } catch (error: any) {
      console.error("Check achievements error:", error)
    }
  }

  // Generate referral code
  const generateReferralCode = async () => {
    try {
      if (!user) throw new Error("No user logged in")

      const code = generateRandomCode(8)

      const { data, error } = await supabase
        .from("referrals")
        .insert([{ user_id: user.id, code }])
        .select()

      if (error) throw error

      // Update local state
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              referral_info: {
                ...prev.referral_info,
                referral_code: code,
              },
            }
          : null,
      )

      toast({
        title: "Referral Code Generated",
        description: "Your referral code has been created successfully!",
      })

      return code
    } catch (error: any) {
      console.error("Generate referral code error:", error)
      toast({
        title: "Failed to generate referral code",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Get referral statistics
  const getReferralStats = async () => {
    try {
      if (!user) throw new Error("No user logged in")

      const { data, error } = await supabase.rpc("get_referral_stats", {
        user_id_param: user.id,
      })

      if (error) throw error

      return data
    } catch (error: any) {
      console.error("Get referral stats error:", error)
      toast({
        title: "Failed to get referral statistics",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Claim referral reward
  const claimReferralReward = async (rewardId: string) => {
    try {
      if (!user) throw new Error("No user logged in")

      const { data, error } = await supabase.rpc("claim_referral_reward", {
        user_id_param: user.id,
        reward_id_param: rewardId,
      })

      if (error) throw error

      // Update local state based on reward type
      if (data.reward_type === "tokens") {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                tokens: prev.tokens + data.amount,
              }
            : null,
        )
      } else if (data.reward_type === "xp") {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                xp: prev.xp + data.amount,
              }
            : null,
        )
      }

      toast({
        title: "Reward Claimed",
        description: `You've claimed ${data.amount} ${data.reward_type}!`,
      })
    } catch (error: any) {
      console.error("Claim referral reward error:", error)
      toast({
        title: "Failed to claim reward",
        description: error.message,
        variant: "destructive",
      })
      throw error
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        // Fetch user profile
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (error || !profileData) {
          // Profile doesn't exist, initialize it
          await initializeUserProfile(session.user)
        } else {
          // Update status to online
          await supabase.from("profiles").update({ status: "online" }).eq("id", session.user.id)

          setProfile({ ...profileData, status: "online" })
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    // Set user as online when the app loads
    const setUserOnline = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        await supabase.from("profiles").update({ status: "online" }).eq("id", session.user.id)
      }
    }

    setUserOnline()

    // Set user as offline when the window is closed
    const handleBeforeUnload = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        await supabase.from("profiles").update({ status: "offline" }).eq("id", session.user.id)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithDiscord,
    handleDiscordCallback,
    logout,
    updateUserProfile,
    updateUserStatus,
    giftPremium,
    checkAchievements,
    generateReferralCode,
    getReferralStats,
    claimReferralReward,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
