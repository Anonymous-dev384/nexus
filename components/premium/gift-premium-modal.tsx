"use client"

import { useState } from "react"
import { useAuth, type UserProfile } from "@/lib/auth-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Gift, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface GiftPremiumModalProps {
  isOpen: boolean
  onClose: () => void
  recipient: UserProfile | null
}

export default function GiftPremiumModal({ isOpen, onClose, recipient }: GiftPremiumModalProps) {
  const { user, giftPremium } = useAuth()
  const { toast } = useToast()

  const [duration, setDuration] = useState<number>(7)
  const [customDuration, setCustomDuration] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user || !recipient) return

    try {
      setIsSubmitting(true)

      // Use either the predefined duration or the custom one
      const finalDuration = duration === 0 ? Number.parseInt(customDuration) : duration

      if (isNaN(finalDuration) || finalDuration <= 0) {
        toast({
          title: "Invalid duration",
          description: "Please enter a valid number of days",
          variant: "destructive",
        })
        return
      }

      if (finalDuration > user.tokens) {
        toast({
          title: "Insufficient tokens",
          description: `You need ${finalDuration} tokens to gift ${finalDuration} days of premium`,
          variant: "destructive",
        })
        return
      }

      await giftPremium(recipient.uid, finalDuration)

      toast({
        title: "Premium gifted",
        description: `You've successfully gifted ${finalDuration} days of premium to ${recipient.displayName}`,
      })

      onClose()
    } catch (error: any) {
      console.error("Error gifting premium:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to gift premium",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Gift Premium
          </DialogTitle>
          <DialogDescription>Gift premium features to another user using your tokens.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {recipient && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-md">
              <Avatar>
                <AvatarImage src={recipient.photoURL || "/placeholder.svg"} alt={recipient.displayName} />
                <AvatarFallback>{recipient.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{recipient.displayName}</p>
                <p className="text-sm text-muted-foreground">@{recipient.username}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Duration</Label>
            <RadioGroup value={duration.toString()} onValueChange={(value) => setDuration(Number.parseInt(value))}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="7" id="r1" />
                <Label htmlFor="r1" className="flex items-center gap-2">
                  7 days
                  <Badge variant="outline" className="ml-2">
                    7 tokens
                  </Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="30" id="r2" />
                <Label htmlFor="r2" className="flex items-center gap-2">
                  30 days
                  <Badge variant="outline" className="ml-2">
                    30 tokens
                  </Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="90" id="r3" />
                <Label htmlFor="r3" className="flex items-center gap-2">
                  90 days
                  <Badge variant="outline" className="ml-2">
                    90 tokens
                  </Badge>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id="r4" />
                <Label htmlFor="r4">Custom</Label>
              </div>
            </RadioGroup>

            {duration === 0 && (
              <div className="mt-2">
                <Label htmlFor="custom-duration">Number of days</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="custom-duration"
                    type="number"
                    min="1"
                    placeholder="Enter days"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    = {customDuration || 0} tokens
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-muted p-3 rounded-md">
            <h4 className="font-medium flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" />
              Premium Benefits
            </h4>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Exclusive themes</li>
              <li>• Extended thread posts</li>
              <li>• Access to Premium Lounge</li>
              <li>• Pin up to 5 posts to profile</li>
            </ul>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm">
                Your balance: <span className="font-medium">{user?.tokens || 0} tokens</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gifting...
                  </>
                ) : (
                  <>Gift Premium</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { Badge } from "@/components/ui/badge"
