import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Initialize Firebase only if it hasn't been initialized yet
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

// Connect to emulators in development if enabled
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && typeof window !== 'undefined') {
  try {
    // Only connect to emulators once
    if (!auth.config.emulator) {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    }
    if (!(db as any)._delegate._databaseId.host.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080)
    }
    if (!storage.app._config.storageBucket?.includes('localhost')) {
      connectStorageEmulator(storage, 'localhost', 9199)
    }
    if (!functions.app._config.projectId?.includes('localhost')) {
      connectFunctionsEmulator(functions, 'localhost', 5001)
    }
    console.log('🔧 Connected to Firebase Emulators')
  } catch (error) {
    console.warn('⚠️ Firebase Emulators connection failed:', error)
  }
} else {
  console.log('🔥 Connected to Firebase Production')
}

export default app
