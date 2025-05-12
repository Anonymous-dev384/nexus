"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Image from "next/image"
import { User, Calendar, MapPin, LinkIcon, Edit, LogOut, Shield, Award, Gift, Heart, MessageSquare } from "lucide-react"
import MainLayout from "../../layouts/main-layout"
import { useAuth } from "../../lib/auth-provider"
import { db } from "../../lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { Loader } from "../../components/ui/loader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import PostCard from "../../components/post/post-card"
import VerificationBadges from "../../components/profile/verification-badges"

export default function Profile() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    likes: 0,
    comments: 0,
  })

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          setProfile(userDoc.data())
        }

        // Fetch user posts
        const postsQuery = query(
          collection(db, "posts"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(10),
        )

        const postsSnapshot = await getDocs(postsQuery)
        const postsData = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setPosts(postsData)

        // Fetch user stats
        const followersQuery = query(collection(db, "follows"), where("followingId", "==", user.uid))

        const followingQuery = query(collection(db, "follows"), where("followerId", "==", user.uid))

        const [followersSnapshot, followingSnapshot] = await Promise.all([
          getDocs(followersQuery),
          getDocs(followingQuery),
        ])

        setStats({
          posts: postsData.length,
          followers: followersSnapshot.size,
          following: followingSnapshot.size,
          likes: postsData.reduce((acc, post) => acc + (post.likes?.length || 0), 0),
          comments: postsData.reduce((acc, post) => acc + (post.commentCount || 0), 0),
        })

        setLoading(false)
      } catch (error) {
        console.error("Error fetching profile:", error)
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleEditProfile = () => {
    router.push("/settings")
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-full items-center justify-center">
          <Loader size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="flex h-full flex-col items-center justify-center">
          <User className="mb-4 h-16 w-16 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold">Profile not found</h2>
          <p className="mb-4 text-gray-500">The profile you're looking for doesn't exist or you don't have access.</p>
          <button
            onClick={() => router.push("/feed")}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Back to Feed
          </button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <div className="relative mb-6 h-32 w-full rounded-lg bg-gradient-to-r from-blue-400 to-purple-500">
            {profile.coverImage && (
              <Image
                src={profile.coverImage || "/placeholder.svg"}
                alt="Cover"
                fill
                className="rounded-lg object-cover"
              />
            )}
          </div>

          <div className="flex flex-col items-center sm:flex-row sm:items-start">
            <div className="relative -mt-16 mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-gray-200 dark:border-gray-800 sm:mb-0">
              {profile.photoURL ? (
                <Image
                  src={profile.photoURL || "/placeholder.svg"}
                  alt={profile.displayName || "User"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-300 text-gray-600">
                  <User className="h-12 w-12" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col items-center text-center sm:ml-6 sm:items-start sm:text-left">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold">{profile.displayName || "Anonymous User"}</h1>
                {profile.verified && <VerificationBadges type={profile.verifiedType || "blue"} className="ml-2" />}
                {profile.isPremium && (
                  <span className="ml-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-0.5 text-xs font-medium text-white">
                    PREMIUM
                  </span>
                )}
              </div>

              <p className="mt-1 text-gray-600 dark:text-gray-400">@{profile.username || "user"}</p>

              {profile.bio && <p className="mt-3 max-w-md text-gray-700 dark:text-gray-300">{profile.bio}</p>}

              <div className="mt-3 flex flex-wrap gap-3">
                {profile.location && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="mr-1 h-4 w-4" />
                    {profile.location}
                  </div>
                )}

                {profile.website && (
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-500 hover:underline"
                  >
                    <LinkIcon className="mr-1 h-4 w-4" />
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                )}

                {profile.joinDate && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Calendar className="mr-1 h-4 w-4" />
                    Joined {new Date(profile.joinDate.toDate()).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex space-x-2 sm:mt-0">
              <button
                onClick={handleEditProfile}
                className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <Edit className="mr-1 h-4 w-4" />
                Edit
              </button>

              <button
                onClick={handleSignOut}
                className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <LogOut className="mr-1 h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="flex flex-col items-center rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <span className="text-lg font-bold">{stats.posts}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Posts</span>
            </div>

            <div className="flex flex-col items-center rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <span className="text-lg font-bold">{stats.followers}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Followers</span>
            </div>

            <div className="flex flex-col items-center rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <span className="text-lg font-bold">{stats.following}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Following</span>
            </div>

            <div className="flex flex-col items-center rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <span className="text-lg font-bold">{stats.likes}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Likes</span>
            </div>

            <div className="flex flex-col items-center rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
              <span className="text-lg font-bold">{stats.comments}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Comments</span>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4">
            <TabsTrigger value="posts" className="flex items-center">
              <MessageSquare className="mr-2 h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="likes" className="flex items-center">
              <Heart className="mr-2 h-4 w-4" />
              Likes
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center">
              <Award className="mr-2 h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="premium" className="flex items-center">
              <Gift className="mr-2 h-4 w-4" />
              Premium
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                <MessageSquare className="mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium">No posts yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">When you create posts, they'll appear here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes">
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <Heart className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium">No liked posts yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Posts you like will appear here.</p>
            </div>
          </TabsContent>

          <TabsContent value="achievements">
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <Award className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium">No achievements yet</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Complete challenges and quests to earn achievements.
              </p>
              <button
                onClick={() => router.push("/challenges")}
                className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                Explore Challenges
              </button>
            </div>
          </TabsContent>

          <TabsContent value="premium">
            {profile.isPremium ? (
              <div className="rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-600 p-6 text-white">
                <div className="mb-4 flex items-center">
                  <Shield className="mr-2 h-6 w-6" />
                  <h3 className="text-xl font-bold">Premium Member</h3>
                </div>
                <p className="mb-4">
                  You're enjoying all the benefits of premium membership. Thank you for your support!
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-md bg-white/20 p-3">
                    <h4 className="mb-1 font-semibold">Ad-Free Experience</h4>
                    <p className="text-sm">Enjoy browsing without any advertisements</p>
                  </div>
                  <div className="rounded-md bg-white/20 p-3">
                    <h4 className="mb-1 font-semibold">Premium Badge</h4>
                    <p className="text-sm">Stand out with your exclusive premium badge</p>
                  </div>
                  <div className="rounded-md bg-white/20 p-3">
                    <h4 className="mb-1 font-semibold">Premium Lounge</h4>
                    <p className="text-sm">Access to exclusive premium-only content</p>
                  </div>
                  <div className="rounded-md bg-white/20 p-3">
                    <h4 className="mb-1 font-semibold">Priority Support</h4>
                    <p className="text-sm">Get faster responses from our support team</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/premium-lounge")}
                  className="mt-6 rounded-md bg-white px-4 py-2 font-medium text-yellow-600 hover:bg-gray-100"
                >
                  Go to Premium Lounge
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
                <Gift className="mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-medium">Upgrade to Premium</h3>
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  Get ad-free experience, premium badge, and access to exclusive features.
                </p>
                <button
                  onClick={() => router.push("/premium")}
                  className="rounded-md bg-gradient-to-r from-yellow-400 to-yellow-600 px-4 py-2 font-medium text-white hover:from-yellow-500 hover:to-yellow-700"
                >
                  Upgrade Now
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
