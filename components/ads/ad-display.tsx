"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import axios from "axios"
import { ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AdDisplayProps {
  placement: "feed" | "sidebar" | "profile" | "explore"
  className?: string
}

interface Ad {
  id: string
  title: string
  description: string
  imageUrl: string
  targetUrl: string
  advertiser: string
}

export default function AdDisplay({ placement, className = "" }: AdDisplayProps) {
  const { user } = useAuth()
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is premium
  const isPremiumUser = user?.premiumFeatures?.isActive

  useEffect(() => {
    // Don't fetch ads for premium users
    if (isPremiumUser) {
      setLoading(false)
      return
    }

    fetchAd()
  }, [placement, isPremiumUser])

  const fetchAd = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/ads?placement=${placement}`)

      if (response.data) {
        setAd(response.data)
        // Record impression
        axios.post(`/api/ads/${response.data.id}/impression`).catch(console.error)
      } else {
        setAd(null)
      }
    } catch (error) {
      console.error("Error fetching ad:", error)
      setAd(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAdClick = async () => {
    if (!ad) return

    // Open the target URL
    window.open(ad.targetUrl, "_blank")

    // Record click
    try {
      await axios.post(`/api/ads/${ad.id}/click`)
    } catch (error) {
      console.error("Error recording ad click:", error)
    }
  }

  // Don't render anything for premium users
  if (isPremiumUser) return null

  if (loading) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <div className="h-32 bg-muted animate-pulse" />
        <CardContent className="p-3 space-y-2">
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          <div className="h-3 w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  if (!ad) return null

  return (
    <Card
      className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${className}`}
      onClick={handleAdClick}
    >
      <div className="relative">
        <img src={ad.imageUrl || "/placeholder.svg"} alt={ad.title} className="w-full h-auto object-cover" />
        <Badge variant="outline" className="absolute top-2 right-2 bg-background/80">
          Sponsored
        </Badge>
      </div>
      <CardContent className="p-3 space-y-1">
        <h4 className="font-medium text-sm flex items-center">
          {ad.title}
          <ExternalLink className="h-3 w-3 ml-1 inline" />
        </h4>
        <p className="text-xs text-muted-foreground">{ad.description}</p>
      </CardContent>
    </Card>
  )
}
