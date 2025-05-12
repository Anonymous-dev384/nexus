"use client"
import { MainLayout } from "../layouts/main-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Home, Search, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <MainLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="relative w-40 h-40 mb-6">
          <div
            className="absolute inset-0 bg-primary/20 rounded-full animate-ping"
            style={{ animationDuration: "3s" }}
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl font-bold">404</span>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2">Page Not Found</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved to another dimension.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/explore">
              <Search className="mr-2 h-4 w-4" />
              Explore Content
            </Link>
          </Button>

          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
