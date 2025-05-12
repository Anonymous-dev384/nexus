"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/lib/auth-provider"
import { MainLayout } from "@/layouts/main-layout"
import AuthLayout from "@/layouts/auth-layout"

// Pages
import Login from "@/pages/auth/login"
import Register from "@/pages/auth/register"
import Feed from "@/pages/feed"
import Profile from "@/pages/profile"
import PostDetail from "@/pages/post-detail"
import Messages from "@/pages/messages"
import Notifications from "@/pages/notifications"
import Leaderboard from "@/pages/leaderboard"
import PremiumLounge from "@/pages/premium-lounge"
import Explore from "@/pages/explore"
import Settings from "@/pages/settings"
import Achievements from "@/pages/achievements"
import Events from "@/pages/events"
import Challenges from "@/pages/challenges"
import Stories from "@/pages/stories"
import PremiumSuggestions from "@/pages/premium-suggestions"
import NotFound from "@/pages/not-found"

// Admin Pages
import AdminDashboard from "@/pages/admin/index"
import AdminUsers from "@/pages/admin/users"
import AdminContent from "@/pages/admin/content"
import AdminEvents from "@/pages/admin/events"
import AdminAds from "@/pages/admin/ads"
import AdminAdmins from "@/pages/admin/admins"
import AdminReports from "@/pages/admin/reports"
import AdminAnalytics from "@/pages/admin/analytics"
import AdminSettings from "@/pages/admin/settings"

// Loader
import { Loader } from "@/components/ui/loader"

// Protected Route component
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return element
}

// Premium content route
const PremiumRoute = ({ element }: { element: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!user.premiumFeatures?.isActive) {
    return <Navigate to="/" replace />
  }

  return element
}

export default function AppRouter() {
  const { user, loading } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    if (!loading) {
      setIsAuthenticated(!!user)
    }
  }, [user, loading])

  if (isAuthenticated === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
      </Route>

      {/* App routes */}
      <Route element={<ProtectedRoute element={<MainLayout />} />}>
        <Route index element={<Feed />} />
        <Route path="post/:postId" element={<PostDetail />} />
        <Route path="profile/:username" element={<Profile />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:conversationId" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="explore" element={<Explore />} />
        <Route path="settings" element={<Settings />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="premium-lounge" element={<PremiumRoute element={<PremiumLounge />} />} />
        <Route path="events" element={<Events />} />
        <Route path="challenges" element={<Challenges />} />
        <Route path="stories" element={<Stories />} />
        <Route path="premium-suggestions" element={<PremiumRoute element={<PremiumSuggestions />} />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} />} />
      <Route path="/admin/users" element={<ProtectedRoute element={<AdminUsers />} />} />
      <Route path="/admin/content" element={<ProtectedRoute element={<AdminContent />} />} />
      <Route path="/admin/events" element={<ProtectedRoute element={<AdminEvents />} />} />
      <Route path="/admin/ads" element={<ProtectedRoute element={<AdminAds />} />} />
      <Route path="/admin/admins" element={<ProtectedRoute element={<AdminAdmins />} />} />
      <Route path="/admin/reports" element={<ProtectedRoute element={<AdminReports />} />} />
      <Route path="/admin/analytics" element={<ProtectedRoute element={<AdminAnalytics />} />} />
      <Route path="/admin/settings" element={<ProtectedRoute element={<AdminSettings />} />} />

      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
