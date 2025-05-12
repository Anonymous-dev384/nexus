"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Loader } from "@/components/ui/loader"

export default function PremiumSuggestions() {
  const { user } = useAuth()
  const [suggestions, setSuggestions] = useState([])
  const [newSuggestion, setNewSuggestion] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Fetch suggestions
    const fetchSuggestions = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        setTimeout(() => {
          setSuggestions([
            {
              id: "1",
              text: "Add custom themes for premium users",
              votes: 24,
              status: "under_review",
              author: "premium_user1",
            },
            {
              id: "2",
              text: "Exclusive premium-only events",
              votes: 18,
              status: "planned",
              author: "premium_user2",
            },
            {
              id: "3",
              text: "Premium user badges on posts",
              votes: 32,
              status: "implemented",
              author: "premium_user3",
            },
          ])
          setLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching suggestions:", error)
        setLoading(false)
      }
    }

    fetchSuggestions()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newSuggestion.trim()) return

    setSubmitting(true)

    // In a real app, this would be an API call
    // For now, we'll simulate adding a suggestion
    setTimeout(() => {
      const newSuggestionObj = {
        id: Date.now().toString(),
        text: newSuggestion,
        votes: 1,
        status: "new",
        author: user?.username || "anonymous",
      }

      setSuggestions([newSuggestionObj, ...suggestions])
      setNewSuggestion("")
      setSubmitting(false)
    }, 1000)
  }

  const handleVote = (id) => {
    setSuggestions(
      suggestions.map((suggestion) =>
        suggestion.id === id ? { ...suggestion, votes: suggestion.votes + 1 } : suggestion,
      ),
    )
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Premium Suggestions Board</h1>
        <p className="text-gray-600 dark:text-gray-400">
          As a premium member, you can suggest new features and vote on existing suggestions.
        </p>
      </div>

      <div className="mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="suggestion" className="mb-2 block font-medium">
              Suggest a new feature
            </label>
            <textarea
              id="suggestion"
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-3 dark:border-gray-700 dark:bg-gray-800"
              placeholder="What would you like to see in NexusSphere?"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !newSuggestion.trim()}
            className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Suggestion"}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Current Suggestions</h2>

        {suggestions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No suggestions yet. Be the first to suggest a feature!</p>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-medium">{suggestion.text}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Suggested by {suggestion.author}</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => handleVote(suggestion.id)}
                      className="text-gray-600 hover:text-purple-600 dark:text-gray-400"
                    >
                      ▲
                    </button>
                    <span className="font-medium">{suggestion.votes}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      suggestion.status === "implemented"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : suggestion.status === "planned"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : suggestion.status === "under_review"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {suggestion.status === "implemented"
                      ? "Implemented"
                      : suggestion.status === "planned"
                        ? "Planned"
                        : suggestion.status === "under_review"
                          ? "Under Review"
                          : "New"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
