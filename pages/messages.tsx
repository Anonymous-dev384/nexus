"use client"

import { useEffect, useState, useRef } from "react"
import { useAuth, type UserProfile } from "@/lib/auth-provider"
import { useAppStore, type Message, type Conversation } from "@/lib/store"
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/hooks/use-toast"
import axios from "axios"

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
