"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Copy, Facebook, Twitter, Mail, Link, Share2 } from "lucide-react"
import axios from "axios"

interface ReferralShareModalProps {
  isOpen: boolean
  onClose: () => void
  referralCode: string
}

export function ReferralShareModal({ isOpen, onClose, referralCode }: ReferralShareModalProps) {
  const { toast } = useToast()
  const [shareTab, setShareTab] = useState("link")

  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?ref=${referralCode}`
      : `/register?ref=${referralCode}`

  const emailSubject = "Join me on NexusSphere!"
  const emailBody = `Hey! I'm inviting you to join NexusSphere, a futuristic social media platform. Use my referral code ${referralCode} or sign up through this link: ${referralLink}`

  const twitterText = `Join me on NexusSphere, the futuristic social media platform! Use my referral code ${referralCode} to get started. ${referralLink}`

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent("Join me on NexusSphere, the futuristic social media platform!")}`

  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`

  const emailShareUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: message,
    })

    // Track referral link click
    if (referralCode) {
      axios
        .post("/api/referrals/track-click", { referralCode })
        .catch((error) => console.error("Error tracking referral click:", error))
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on NexusSphere!",
          text: `Use my referral code ${referralCode} to join NexusSphere!`,
          url: referralLink,
        })

        // Track referral link click
        if (referralCode) {
          axios
            .post("/api/referrals/track-click", { referralCode })
            .catch((error) => console.error("Error tracking referral click:", error))
        }
      } catch (error) {
        console.error("Error sharing:", error)
      }
    } else {
      copyToClipboard(referralLink, "Referral link copied to clipboard!")
    }
  }

  const openShareWindow = (url: string) => {
    window.open(url, "_blank", "width=600,height=400")

    // Track referral link click
    if (referralCode) {
      axios
        .post("/api/referrals/track-click", { referralCode })
        .catch((error) => console.error("Error tracking referral click:", error))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Referral</DialogTitle>
          <DialogDescription>Invite friends to join NexusSphere and earn rewards!</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={shareTab} onValueChange={setShareTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="link">
              <Link className="h-4 w-4 mr-2" />
              Copy Link
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="h-4 w-4 mr-2" />
              Social Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Referral Link</label>
              <div className="flex space-x-2">
                <Input value={referralLink} readOnly className="flex-1" />
                <Button size="icon" onClick={() => copyToClipboard(referralLink, "Referral link copied to clipboard!")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Referral Code</label>
              <div className="flex space-x-2">
                <Input value={referralCode} readOnly className="flex-1 font-mono" />
                <Button size="icon" onClick={() => copyToClipboard(referralCode, "Referral code copied to clipboard!")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {navigator.share && (
              <Button className="w-full" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => openShareWindow(facebookShareUrl)}
              >
                <Facebook className="h-6 w-6 mb-2" />
                <span className="text-xs">Facebook</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => openShareWindow(twitterShareUrl)}
              >
                <Twitter className="h-6 w-6 mb-2" />
                <span className="text-xs">Twitter</span>
              </Button>

              <Button
                variant="outline"
                className="flex flex-col h-auto py-4"
                onClick={() => openShareWindow(emailShareUrl)}
              >
                <Mail className="h-6 w-6 mb-2" />
                <span className="text-xs">Email</span>
              </Button>
            </div>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground">Or share this message with your friends:</p>
              <div className="mt-2 p-3 bg-muted rounded-md text-sm">
                Join me on NexusSphere! Use my referral code <span className="font-mono font-bold">{referralCode}</span>{" "}
                to get started.
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() =>
                  copyToClipboard(
                    `Join me on NexusSphere! Use my referral code ${referralCode} to get started. ${referralLink}`,
                    "Message copied to clipboard!",
                  )
                }
              >
                <Copy className="h-3 w-3 mr-2" />
                Copy Message
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
