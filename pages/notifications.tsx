"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { Bell, Check, Trash, User, Calendar, Heart, MessageCircle, Award, Gift } from "lucide-react"
import MainLayout from "../layouts/main-layout"
import { useAuth } from "../lib/auth-provider"
import { db } from "../lib/firebase"
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import type { Notification } from "../models/Notification"
import { Loader } from "../components/ui/loader"

export default function Notifications() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      try {
        const q = query(collection(db, "notifications"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

        const querySnapshot = await getDocs(q)
        const notificationsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Notification[]

        setNotifications(notificationsData)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching notifications:", error)
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [user])

  const markAsRead = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId)
      await updateDoc(notificationRef, {
        read: true,
      })

      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === notificationId ? { ...notification, read: true } : notification,
        ),
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const notificationRef = doc(db, "notifications", notificationId)
      await deleteDoc(notificationRef)

      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== notificationId),
      )
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "follow":
        return <User className="h-5 w-5 text-blue-500" />
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />
      case "comment":
        return <MessageCircle className="h-5 w-5 text-green-500" />
      case "mention":
        return <User className="h-5 w-5 text-purple-500" />
      case "event":
        return <Calendar className="h-5 w-5 text-yellow-500" />
      case "achievement":
        return <Award className="h-5 w-5 text-amber-500" />
      case "premium":
        return <Gift className="h-5 w-5 text-pink-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (notification.link) {
      router.push(notification.link)
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

  return (
    <MainLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                notifications.forEach((notification) => {
                  if (!notification.read) {
                    markAsRead(notification.id)
                  }
                })
              }}
              className="flex items-center rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
            >
              <Check className="mr-1 h-4 w-4" />
              Mark all as read
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
            <Bell className="mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium">No notifications yet</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">When you get notifications, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative flex items-start rounded-lg border p-4 transition-colors ${
                  notification.read ? "bg-white dark:bg-gray-800" : "bg-blue-50 dark:bg-gray-700"
                }`}
              >
                <div className="mr-4 mt-0.5 rounded-full bg-gray-100 p-2 dark:bg-gray-700">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                  <div className="mb-1 font-medium">{notification.title}</div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(notification.createdAt.toDate()).toLocaleString()}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-blue-500 dark:hover:bg-gray-700"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-700"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
