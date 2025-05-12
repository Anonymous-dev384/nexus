"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth, type UserProfile } from "@/lib/auth-provider"
import { useAppStore, type Message, type Conversation } from "@/lib/store"
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"
import { Input } from "@/components/ui/input"
import { Loader } from "@/components/ui/loader"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, MessageSquare, Paperclip, Send, X } from "lucide-react"
import { format } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export default function Messages() {
  const { user } = useAuth()
  const {
    conversations,
    setConversations,
    messages,
    setMessages,
    addMessage,
    activeConversationId,
    setActiveConversation,
  } = useAppStore()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
  const [participants, setParticipants] = useState<Record<string, UserProfile>>({})
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false)
  const [showMiniGameSelector, setShowMiniGameSelector] = useState(false)
  const [showPollCreator, setShowPollCreator] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [fileUploading, setFileUploading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return

      try {
        setLoading(true)

        const conversationsRef = collection(db, "conversations")
        const q = query(
          conversationsRef,
          where("participants", "array-contains", user.uid),
          orderBy("updatedAt", "desc"),
        )

        // Set up real-time listener for conversations
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const fetchedConversations: Conversation[] = []
          const participantsMap: Record<string, UserProfile> = {}

          for (const doc of snapshot.docs) {
            const conversationData = doc.data() as Omit<Conversation, "id">

            // Fetch participants' data
            for (const participantId of conversationData.participants) {
              if (participantId !== user.uid && !participantsMap[participantId]) {
                const participantDoc = await getDocs(query(collection(db, "users"), where("uid", "==", participantId)))

                if (!participantDoc.empty) {
                  participantsMap[participantId] = participantDoc.docs[0].data() as UserProfile
                }
              }
            }

            fetchedConversations.push({
              id: doc.id,
              participants: conversationData.participants,
              lastMessage: conversationData.lastMessage,
              updatedAt: conversationData.updatedAt.toDate().toISOString(),
            })
          }

          setConversations(fetchedConversations)
          setFilteredConversations(fetchedConversations)
          setParticipants(participantsMap)
          setLoading(false)

          // If there's at least one conversation and none is active, set the first one as active
          if (fetchedConversations.length > 0 && !activeConversationId) {
            setActiveConversation(fetchedConversations[0].id)
            fetchMessages(fetchedConversations[0].id)
          }
        })

        return unsubscribe
      } catch (error) {
        console.error("Error fetching conversations:", error)
        toast({
          title: "Error",
          description: "Failed to load conversations",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    fetchConversations()
  }, [user])

  // Filter conversations when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredConversations(conversations)
    } else {
      const filtered = conversations.filter((conversation) => {
        const otherParticipantId = conversation.participants.find((id) => id !== user?.uid)
        if (!otherParticipantId) return false

        const otherParticipant = participants[otherParticipantId]
        if (!otherParticipant) return false

        return (
          otherParticipant.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          otherParticipant.username.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })

      setFilteredConversations(filtered)
    }
  }, [searchQuery, conversations, participants, user])

  // Fetch messages for active conversation
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId)
    }
  }, [activeConversationId])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages[activeConversationId]])

  const fetchMessages = async (conversationId: string) => {
    if (!user) return

    try {
      setLoadingMessages(true)

      const messagesRef = collection(db, "messages")
      const q = query(messagesRef, where("conversationId", "==", conversationId), orderBy("createdAt", "asc"))

      // Set up real-time listener for messages
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const fetchedMessages: Message[] = []

        for (const doc of snapshot.docs) {
          const messageData = doc.data()

          fetchedMessages.push({
            id: doc.id,
            senderId: messageData.senderId,
            sender: messageData.senderId === user.uid ? user : participants[messageData.senderId],
            receiverId: messageData.receiverId,
            receiver: messageData.receiverId === user.uid ? user : participants[messageData.receiverId],
            content: messageData.content,
            mediaUrls: messageData.mediaUrls || [],
            mediaType: messageData.mediaType || "text",
            sticker: messageData.sticker,
            poll: messageData.poll,
            game: messageData.game,
            read: messageData.read,
            createdAt: messageData.createdAt.toDate().toISOString(),
          })
        }

        setMessages(conversationId, fetchedMessages)
        setLoadingMessages(false)
      })

      return unsubscribe
    } catch (error) {
      console.error("Error fetching messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
      setLoadingMessages(false)
    }
  }

  const handleSendMessage = async () => {
    if (!user || !activeConversationId || (!messageText.trim() && selectedFiles.length === 0)) return

    try {
      setSendingMessage(true)

      const activeConversation = conversations.find((c) => c.id === activeConversationId)
      if (!activeConversation) return

      const receiverId = activeConversation.participants.find((id) => id !== user.uid)
      if (!receiverId) return

      // Handle file uploads if any
      let mediaUrls: string[] = []
      let mediaType = "text"

      if (selectedFiles.length > 0) {
        setFileUploading(true)

        try {
          // Upload each file
          const uploadPromises = selectedFiles.map(async (file) => {
            const formData = new FormData()
            formData.append("file", file)

            const response = await axios.post("/api/upload", formData)
            return response.data.url
          })

          mediaUrls = await Promise.all(uploadPromises)

          // Determine media type
          if (selectedFiles[0].type.startsWith("image/")) {
            mediaType = "image"
          } else if (selectedFiles[0].type.startsWith("video/")) {
            mediaType = "video"
          } else {
            mediaType = "file"
          }
        } catch (error) {
          console.error("Error uploading files:", error)
          toast({
            title: "Upload failed",
            description: "Failed to upload files",
            variant: "destructive",
          })
        } finally {
          setFileUploading(false)
        }
      }

      // Create message
      const messageData = {
        conversationId: activeConversationId,
        senderId: user.uid,
        receiverId,
        content: messageText,
        mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        mediaType: mediaUrls.length > 0 ? mediaType : undefined,
        read: false,
        createdAt: serverTimestamp(),
      }

      const messageRef = await addDoc(collection(db, "messages"), messageData)

      // Add to local state
      addMessage(activeConversationId, {
        id: messageRef.id,
        senderId: user.uid,
        sender: user,
        receiverId,
        receiver: participants[receiverId],
        content: messageText,
        mediaUrls,
        mediaType,
        read: false,
        createdAt: new Date().toISOString(),
      })

      setMessageText("")
      setSelectedFiles([])
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSendSticker = async (stickerUrl: string) => {
    if (!user || !activeConversationId) return

    try {
      setSendingMessage(true)

      const activeConversation = conversations.find((c) => c.id === activeConversationId)
      if (!activeConversation) return

      const receiverId = activeConversation.participants.find((id) => id !== user.uid)
      if (!receiverId) return

      // Create message with sticker
      const messageData = {
        conversationId: activeConversationId,
        senderId: user.uid,
        receiverId,
        content: "",
        sticker: stickerUrl,
        mediaType: "sticker",
        read: false,
        createdAt: serverTimestamp(),
      }

      const messageRef = await addDoc(collection(db, "messages"), messageData)

      // Add to local state
      addMessage(activeConversationId, {
        id: messageRef.id,
        senderId: user.uid,
        sender: user,
        receiverId,
        receiver: participants[receiverId],
        content: "",
        sticker: stickerUrl,
        mediaType: "sticker",
        read: false,
        createdAt: new Date().toISOString(),
      })

      setShowStickerPicker(false)
    } catch (error) {
      console.error("Error sending sticker:", error)
      toast({
        title: "Error",
        description: "Failed to send sticker",
        variant: "destructive",
      })
    } finally {
      setSendingMessage(false)
    }
  }

  const handleSendPoll = async (pollData: any) => {
    if (!user || !activeConversationId) return

    try {
      setSendingMessage(true)

      const activeConversation = conversations.find((c) => c.id === activeConversationId)
      if (!activeConversation) return

      const receiverId = activeConversation.participants.find((id) => id !== user.uid)
      if (!receiverId) return

      // Create message with poll
      const messageData = {
        conversationId: activeConversationId,
        senderId: user.uid,
        receiverId,
        content: pollData.question,
        poll: {
          question: pollData.question,
          options: pollData.options,
          votes: {},
          expiresAt: pollData.expiresAt,
        },
        mediaType: "poll",
        read: false,
        createdAt: serverTimestamp(),
      }

      const messageRef = await addDoc(collection(db, "messages"), messageData)

      // Add to local state
      addMessage(activeConversationId, {
        id: messageRef.id,
        senderId: user.uid,
        sender: user,
        receiverId,
        receiver: participants[receiverId],
        content: pollData.question,
        poll: {
          question: pollData.question,
          options: pollData.options,
          votes: {},
          expiresAt: pollData.expiresAt,
        },
        mediaType: "poll",
        read: false,
        createdAt: new Date().toISOString(),
      })

      setShowPollCreator(false)
    } catch (error) {
      console.error("Error sending poll:", error)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleFilesSelected = () => {
    const fileInput = fileInputRef.current
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      setSelectedFiles(Array.from(fileInput.files))
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <div className="w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 dark:border-gray-700 h-full overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : filteredConversations.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredConversations.map((conversation) => {
                const otherParticipantId = conversation.participants.find((id) => id !== user?.uid)
                const otherParticipant = otherParticipantId ? participants[otherParticipantId] : null

                return (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      activeConversationId === conversation.id ? "bg-gray-100 dark:bg-gray-800" : ""
                    }`}
                    onClick={() => setActiveConversation(conversation.id)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={otherParticipant?.photoURL || ""}
                          alt={otherParticipant?.displayName || "User"}
                        />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="ml-3 flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium truncate">
                            {otherParticipant?.displayName || "Unknown User"}
                          </h3>
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500">
                              {format(new Date(conversation.lastMessage.createdAt), "p")}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.lastMessage.senderId === user?.uid ? "You: " : ""}
                            {conversation.lastMessage.content ||
                              (conversation.lastMessage.mediaUrls ? "Sent media" : "Sent a message")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
              <p className="text-sm text-gray-500">
                Start a new conversation by searching for a user or clicking on their profile.
              </p>
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="hidden md:flex flex-col flex-1 h-full">
          {activeConversationId && messages[activeConversationId] ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                {(() => {
                  const activeConversation = conversations.find((c) => c.id === activeConversationId)
                  if (!activeConversation) return null

                  const otherParticipantId = activeConversation.participants.find((id) => id !== user?.uid)
                  const otherParticipant = otherParticipantId ? participants[otherParticipantId] : null

                  return (
                    <>
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={otherParticipant?.photoURL || ""}
                          alt={otherParticipant?.displayName || "User"}
                        />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="ml-3">
                        <h3 className="font-medium">{otherParticipant?.displayName || "Unknown User"}</h3>
                        <p className="text-xs text-gray-500">
                          {otherParticipant?.status === "online" ? "Online" : "Offline"}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center py-12">
                    <Loader size="md" />
                  </div>
                ) : messages[activeConversationId].length > 0 ? (
                  messages[activeConversationId].map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.senderId === user?.uid ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700"
                        }`}
                      >
                        {message.mediaUrls && message.mediaUrls.length > 0 && (
                          <div className="mb-2">
                            {message.mediaType === "image" ? (
                              <div
                                className="grid gap-2"
                                style={{ gridTemplateColumns: `repeat(${Math.min(2, message.mediaUrls.length)}, 1fr)` }}
                              >
                                {message.mediaUrls.map((url, index) => (
                                  <img
                                    key={index}
                                    src={url || "/placeholder.svg"}
                                    alt={`Media ${index + 1}`}
                                    className="rounded-md max-h-60 w-full object-cover cursor-pointer"
                                    onClick={() => window.open(url, "_blank")}
                                  />
                                ))}
                              </div>
                            ) : message.mediaType === "video" ? (
                              <video src={message.mediaUrls[0]} controls className="rounded-md max-h-60 w-full" />
                            ) : (
                              <div className="flex items-center space-x-2 p-2 bg-gray-200 dark:bg-gray-600 rounded">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-sm truncate">Attachment</span>
                              </div>
                            )}
                          </div>
                        )}

                        {message.sticker && (
                          <img
                            src={message.sticker || "/placeholder.svg"}
                            alt="Sticker"
                            className="max-h-40 max-w-full"
                          />
                        )}

                        {message.content && <p>{message.content}</p>}

                        <div className="text-xs mt-1 opacity-70 text-right">
                          {format(new Date(message.createdAt), "p")}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                    <p className="text-sm text-gray-500">Send a message to start the conversation.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-end space-x-2">
                  <div className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 focus-within:border-blue-500 dark:focus-within:border-blue-500 overflow-hidden">
                    <Textarea
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="min-h-[80px] max-h-[200px] border-0 focus-visible:ring-0 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />

                    {selectedFiles.length > 0 && (
                      <div className="p-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-medium mb-1">Selected files:</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center bg-white dark:bg-gray-700 rounded px-2 py-1">
                              <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="ml-1 text-gray-500 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input type="file" ref={fileInputRef} onChange={handleFilesSelected} multiple className="hidden" />

                    <Button type="button" size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-5 w-5" />
                    </Button>

                    <Button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={(!messageText.trim() && selectedFiles.length === 0) || sendingMessage || fileUploading}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4"
                    >
                      {sendingMessage || fileUploading ? (
                        <Loader size="sm" className="text-white" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <MessageSquare className="h-16 w-16 text-gray-300 mb-6" />
              <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
              <p className="text-gray-500 max-w-md mb-6">
                Select a conversation from the sidebar or start a new one by searching for a user.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
