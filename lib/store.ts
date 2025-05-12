import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { UserProfile } from "@/lib/auth-provider"

export interface Post {
  id: string
  authorId: string
  author?: UserProfile
  content: string
  media?: {
    type: "image" | "video"
    url: string
  }[]
  likes: string[]
  comments: Comment[]
  createdAt: string
  isThread: boolean
  threadParentId?: string
  threadChildren?: string[]
  sentiment?: "happy" | "motivated" | "neutral" | "sad" | "angry"
}

export interface Comment {
  id: string
  authorId: string
  author?: UserProfile
  content: string
  likes: string[]
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  type: "like" | "comment" | "follow" | "mention" | "system"
  fromUserId?: string
  fromUser?: UserProfile
  postId?: string
  commentId?: string
  content: string
  read: boolean
  createdAt: string
}

export interface Message {
  id: string
  senderId: string
  sender?: UserProfile
  receiverId: string
  receiver?: UserProfile
  content: string
  read: boolean
  createdAt: string
}

export interface Conversation {
  id: string
  participants: string[]
  lastMessage?: Message
  updatedAt: string
}

interface AppState {
  posts: Post[]
  notifications: Notification[]
  conversations: Conversation[]
  messages: Record<string, Message[]>
  activeConversationId: string | null
  isComposingPost: boolean
  isRightSidebarOpen: boolean
  currentTheme: "light" | "dark" | "system"

  // Actions
  setPosts: (posts: Post[]) => void
  addPost: (post: Post) => void
  updatePost: (postId: string, data: Partial<Post>) => void
  deletePost: (postId: string) => void
  likePost: (postId: string, userId: string) => void
  unlikePost: (postId: string, userId: string) => void
  addComment: (postId: string, comment: Comment) => void

  setNotifications: (notifications: Notification[]) => void
  markNotificationAsRead: (notificationId: string) => void
  markAllNotificationsAsRead: () => void

  setConversations: (conversations: Conversation[]) => void
  setMessages: (conversationId: string, messages: Message[]) => void
  addMessage: (conversationId: string, message: Message) => void
  setActiveConversation: (conversationId: string | null) => void

  setIsComposingPost: (isComposing: boolean) => void
  setIsRightSidebarOpen: (isOpen: boolean) => void
  setCurrentTheme: (theme: "light" | "dark" | "system") => void
}

// Check if window is defined (client-side) for localStorage
const isClient = typeof window !== "undefined"

// Get initial theme from localStorage or default to system
const getInitialTheme = (): "light" | "dark" | "system" => {
  if (!isClient) return "dark" // Server-side default

  try {
    const storedTheme = localStorage.getItem("theme")
    if (storedTheme) {
      const theme = JSON.parse(storedTheme)
      if (theme === "light" || theme === "dark" || theme === "system") {
        return theme
      }
    }
  } catch (e) {
    console.error("Failed to parse stored theme:", e)
  }

  return "dark" // Default theme
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      posts: [],
      notifications: [],
      conversations: [],
      messages: {},
      activeConversationId: null,
      isComposingPost: false,
      isRightSidebarOpen: true,
      currentTheme: getInitialTheme(),

      // Posts actions
      setPosts: (posts) => set({ posts }),
      addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
      updatePost: (postId, data) =>
        set((state) => ({
          posts: state.posts.map((post) => (post.id === postId ? { ...post, ...data } : post)),
        })),
      deletePost: (postId) =>
        set((state) => ({
          posts: state.posts.filter((post) => post.id !== postId),
        })),
      likePost: (postId, userId) =>
        set((state) => ({
          posts: state.posts.map((post) => (post.id === postId ? { ...post, likes: [...post.likes, userId] } : post)),
        })),
      unlikePost: (postId, userId) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId ? { ...post, likes: post.likes.filter((id) => id !== userId) } : post,
          ),
        })),
      addComment: (postId, comment) =>
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === postId ? { ...post, comments: [...post.comments, comment] } : post,
          ),
        })),

      // Notifications actions
      setNotifications: (notifications) => set({ notifications }),
      markNotificationAsRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === notificationId ? { ...notification, read: true } : notification,
          ),
        })),
      markAllNotificationsAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({ ...notification, read: true })),
        })),

      // Messages actions
      setConversations: (conversations) => set({ conversations }),
      setMessages: (conversationId, messages) =>
        set((state) => ({
          messages: { ...state.messages, [conversationId]: messages },
        })),
      addMessage: (conversationId, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: [...(state.messages[conversationId] || []), message],
          },
        })),
      setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),

      // UI actions
      setIsComposingPost: (isComposing) => set({ isComposingPost: isComposing }),
      setIsRightSidebarOpen: (isOpen) => set({ isRightSidebarOpen: isOpen }),
      setCurrentTheme: (theme) => {
        if (isClient) {
          localStorage.setItem("theme", JSON.stringify(theme))

          // Update DOM immediately for immediate visual feedback
          const root = window.document.documentElement
          root.classList.remove("light", "dark")

          if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
            root.classList.add(systemTheme)
          } else {
            root.classList.add(theme)
          }
        }

        set({ currentTheme: theme })
      },
    }),
    {
      name: "nexus-sphere-storage",
      partialize: (state) => ({
        currentTheme: state.currentTheme,
        isRightSidebarOpen: state.isRightSidebarOpen,
      }),
    },
  ),
)
