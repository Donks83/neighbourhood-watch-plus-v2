'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { UserProfile, UserAddress } from '@/types/camera'
import type { UserRole } from '@/types/verification'
import { geocodeAddress, validateAddress, formatAddressForGeocoding } from '@/lib/geocoding'



interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  userRole: UserRole | null
  isAdmin: boolean
  loading: boolean
  isEmailVerified: boolean
  
  // Auth methods
  signUp: (email: string, password: string, displayName?: string, address?: Partial<UserAddress>) => Promise<User>
  signIn: (email: string, password: string) => Promise<User>
  signInWithGoogle: () => Promise<User>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  
  // Profile methods
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>
  updateUserAddress: (address: Partial<UserAddress>) => Promise<void>
  refreshUserProfile: () => Promise<void>
  
  // Verification
  sendVerificationEmail: () => Promise<void>
  
  // Admin methods
  checkAdminPermission: (permission: string) => Promise<boolean>
  refreshUserRole: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Create user profile in Firestore
  const createUserProfile = async (
    user: User, 
    additionalData: Partial<UserProfile> = {}, 
    addressData?: Partial<UserAddress>
  ) => {
    if (!user) return null

    const userRef = doc(db, 'users', user.uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      let geocodedAddress: UserAddress | undefined
      
      // If address data provided, validate and geocode it
      if (addressData) {
        const validation = validateAddress(addressData)
        if (validation.isValid && addressData.street && addressData.city && addressData.postcode && addressData.country) {
          const addressString = formatAddressForGeocoding(addressData as UserAddress)
          const coordinates = await geocodeAddress(addressString)
          
          if (coordinates) {
            geocodedAddress = {
              street: addressData.street,
              city: addressData.city,
              postcode: addressData.postcode,
              country: addressData.country,
              coordinates,
              isVerified: false
            }
            console.log('âœ… Address geocoded during profile creation')
          } else {
            console.warn('âš ï¸ Failed to geocode address during profile creation')
          }
        }
      }

      const newUserProfile: UserProfile = {
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName || additionalData.displayName || '',
        address: geocodedAddress,
        verified: false,
        trustScore: 0,
        enhancedTrustScore: {
          current: 50,
          breakdown: {
            base: 50,
            verifiedCameras: 0,
            communityParticipation: 0,
            successfulRequests: 0,
            accountAge: 0,
            penalties: 0,
            total: 50
          },
          history: [],
          lastCalculated: serverTimestamp() as any,
          level: 'new',
          badges: []
        },
        createdAt: serverTimestamp() as any,
        lastActiveAt: serverTimestamp() as any,
        stats: {
          camerasRegistered: 0,
          camerasVerified: 0,
          camerasRejected: 0,
          requestsMade: 0,
          footageShared: 0,
          communityHelpScore: 0,
          successfulVerifications: 0
        },
        ...additionalData
      }

      try {
        await setDoc(userRef, newUserProfile)
        console.log('âœ… User profile created successfully')
        return newUserProfile
      } catch (error) {
        console.error('âŒ Error creating user profile:', error)
        throw error
      }
    } else {
      const existingProfile = userSnap.data() as UserProfile
      const updatedProfile: UserProfile = {
        ...existingProfile,
        lastActiveAt: serverTimestamp() as any
      }

      try {
        await setDoc(userRef, updatedProfile, { merge: true })
        return updatedProfile
      } catch (error) {
        console.error('âŒ Error updating user profile:', error)
        return existingProfile
      }
    }
  }

  // Load user profile from Firestore
  const loadUserProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      const userRef = doc(db, 'users', user.uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        const profile = userSnap.data() as UserProfile
        return profile
      } else {
        return await createUserProfile(user)
      }
    } catch (error) {
      console.error('âŒ Error loading user profile:', error)
      return null
    }
  }

  // Sign up with email and password
  const signUp = async (
    email: string, 
    password: string, 
    displayName?: string, 
    address?: Partial<UserAddress>
  ): Promise<User> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      if (displayName) {
        await updateProfile(result.user, { displayName })
      }
      
      await sendEmailVerification(result.user)
      await createUserProfile(result.user, { displayName }, address)
      
      console.log('âœ… User account created successfully')
      return result.user
    } catch (error: any) {
      console.error('âŒ Error creating account:', error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  // Update user address with geocoding
  const updateUserAddress = async (address: Partial<UserAddress>): Promise<void> => {
    if (!user) throw new Error('No user logged in')
    
    try {
      // Validate address
      const validation = validateAddress(address)
      if (!validation.isValid) {
        throw new Error(`Invalid address: ${validation.errors.join(', ')}`)
      }
      
      // Geocode the address
      const addressString = formatAddressForGeocoding(address)
      const coordinates = await geocodeAddress(addressString)
      
      if (!coordinates) {
        throw new Error('Could not find coordinates for this address. Please check the address and try again.')
      }
      
      // Create complete address object
      const completeAddress: UserAddress = {
        street: address.street!,
        city: address.city!,
        postcode: address.postcode!,
        country: address.country!,
        coordinates,
        isVerified: false
      }
      
      // Update user profile with new address
      await updateUserProfile({ address: completeAddress })
      
      console.log('âœ… User address updated and geocoded successfully')
    } catch (error: any) {
      console.error('âŒ Error updating user address:', error)
      throw error
    }
  }

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('âœ… User signed in successfully')
      return result.user
    } catch (error: any) {
      console.error('âŒ Error signing in:', error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  // Sign in with Google
  const signInWithGoogle = async (): Promise<User> => {
    try {
      const provider = new GoogleAuthProvider()
      provider.addScope('email')
      provider.addScope('profile')
      
      const result = await signInWithPopup(auth, provider)
      await createUserProfile(result.user)
      
      console.log('âœ… User signed in with Google successfully')
      return result.user
    } catch (error: any) {
      console.error('âŒ Error signing in with Google:', error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth)
      setUser(null)
      setUserProfile(null)
      console.log('âœ… User signed out successfully')
    } catch (error) {
      console.error('âŒ Error signing out:', error)
      throw error
    }
  }

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email)
      console.log('âœ… Password reset email sent')
    } catch (error: any) {
      console.error('âŒ Error sending password reset email:', error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  // Send email verification
  const sendVerificationEmail = async (): Promise<void> => {
    if (!user) throw new Error('No user logged in')
    
    try {
      await sendEmailVerification(user)
      console.log('âœ… Verification email sent')
    } catch (error: any) {
      console.error('âŒ Error sending verification email:', error)
      throw new Error(getErrorMessage(error.code))
    }
  }

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error('No user logged in')
    
    try {
      const userRef = doc(db, 'users', user.uid)
      const updateData = {
        ...data,
        lastActiveAt: serverTimestamp() as any
      }
      
      await setDoc(userRef, updateData, { merge: true })
      setUserProfile(prev => prev ? { ...prev, ...updateData } : null)
      
      console.log('âœ… User profile updated successfully')
    } catch (error) {
      console.error('âŒ Error updating user profile:', error)
      throw error
    }
  }

  // Refresh user profile from Firestore
  const refreshUserProfile = async (): Promise<void> => {
    if (!user) return
    
    try {
      const profile = await loadUserProfile(user)
      setUserProfile(profile)
    } catch (error) {
      console.error('âŒ Error refreshing user profile:', error)
    }
  }

  // Load user role and admin status
  const loadUserRole = async (user: User): Promise<UserRole | null> => {
    try {
      console.log('Loading user role for:', user.uid)
      const { getUserRole } = await import('@/lib/admin')
      const role = await getUserRole(user.uid)
      console.log('User role loaded:', role)
      return role
    } catch (error) {
      console.error('âŒ Error loading user role:', error)
      return null
    }
  }

  // Check admin permission
  const checkAdminPermission = async (permission: string): Promise<boolean> => {
    if (!user) return false
    
    try {
      const { hasPermission } = await import('@/lib/admin')
      return await hasPermission(user.uid, permission as any)
    } catch (error) {
      console.error('âŒ Error checking admin permission:', error)
      return false
    }
  }

  // Refresh user role
  const refreshUserRole = async (): Promise<void> => {
    if (!user) return
    
    try {
      const role = await loadUserRole(user)
      setUserRole(role)
      setIsAdmin(role ? ['admin', 'moderator', 'super_admin'].includes(role.role) : false)
    } catch (error) {
      console.error('âŒ Error refreshing user role:', error)
    }
  }

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('User authenticated, loading profile and role...')
        setUser(user)
        // Load profile and role in parallel
        const [profile, role] = await Promise.all([
          loadUserProfile(user),
          loadUserRole(user)
        ])
        console.log('Profile loaded:', profile?.displayName)
        console.log('Profile role:', profile?.role || 'No role')
        setUserProfile(profile)
        setUserRole(role)
        const profileRole = profile?.role || 'user'
        const adminStatus = ['admin', 'super_admin'].includes(profileRole)
        console.log('Admin status:', adminStatus, 'role:', profileRole)
        setIsAdmin(adminStatus)
      } else {
        setUser(null)
        setUserProfile(null)
        setUserRole(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Helper function for error messages
  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.'
      case 'auth/user-not-found':
        return 'No account found with this email address.'
      case 'auth/wrong-password':
        return 'Incorrect password.'
      case 'auth/invalid-credential':
        return 'Invalid email or password.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  const value: AuthContextType = {
    user,
    userProfile,
    userRole,
    isAdmin,
    loading,
    isEmailVerified: user?.emailVerified || false,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserAddress,
    refreshUserProfile,
    sendVerificationEmail,
    checkAdminPermission,
    refreshUserRole
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

