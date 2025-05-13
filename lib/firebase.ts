import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "undefined" &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )
}

// Your Firebase configuration with fallbacks for build time
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy-api-key-for-build",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy-domain.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-bucket.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456789",
}

// Initialize Firebase only if it's not already initialized
const apps = getApps()
const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0]

// Initialize Firebase services with error handling
let auth, db, storage

// Only initialize Firebase services in browser environment and when properly configured
if (isBrowser) {
  try {
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)

    // Use emulators in development if needed
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
      // Uncomment these lines to use Firebase emulators
      // connectAuthEmulator(auth, 'http://localhost:9099')
      // connectFirestoreEmulator(db, 'localhost', 8080)
      // connectStorageEmulator(storage, 'localhost', 9199)
    }
  } catch (error) {
    console.error("Firebase initialization error:", error)

    // Provide mock implementations for build/SSR
    auth = { currentUser: null } as any
    db = { collection: () => ({ get: async () => ({ docs: [] }) }) } as any
    storage = {} as any
  }
} else {
  // Provide mock implementations for build/SSR
  auth = { currentUser: null } as any
  db = {
    collection: () => ({
      get: async () => ({ docs: [] }),
      where: () => ({
        get: async () => ({ docs: [] }),
        orderBy: () => ({
          get: async () => ({ docs: [] }),
        }),
      }),
      orderBy: () => ({
        limit: () => ({
          get: async () => ({ docs: [] }),
        }),
        get: async () => ({ docs: [] }),
      }),
      limit: () => ({
        get: async () => ({ docs: [] }),
      }),
      doc: () => ({
        get: async () => ({ exists: false, data: () => ({}) }),
      }),
    }),
  } as any
  storage = {} as any
}

// Helper function to check if Firebase is available
export const isFirebaseAvailable = () => {
  return isBrowser && isFirebaseConfigured()
}

export { auth, db, storage }
export default app
