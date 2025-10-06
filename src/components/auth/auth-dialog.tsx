'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Mail, Lock, User, Eye, EyeOff, Shield, AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import AddressCollectionForm from './address-collection-form'
import type { UserAddress } from '@/types/camera'

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  displayName: z.string().min(2, 'Name must be at least 2 characters')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address')
})

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

type AuthMode = 'login' | 'register' | 'reset' | 'address'

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: AuthMode
}

export default function AuthDialog({ 
  isOpen, 
  onClose, 
  initialMode = 'login' 
}: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [pendingRegistration, setPendingRegistration] = useState<RegisterFormData | null>(null)

  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth()

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // Register form
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    }
  })

  // Reset password form
  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: ''
    }
  })

  // Handle login
  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      await signIn(data.email, data.password)
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle register
  const handleRegister = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Store registration data and move to address collection
      setPendingRegistration(data)
      setMode('address')
      setError(null)
      setSuccessMessage(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle password reset
  const handlePasswordReset = async (data: ResetPasswordFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      await resetPassword(data.email)
      setSuccessMessage('Password reset email sent! Check your inbox.')
      setMode('login')
      resetForm.reset()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      await signInWithGoogle()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle address submission (complete registration with address)
  const handleAddressSubmission = async (address: UserAddress) => {
    if (!pendingRegistration) {
      setError('Registration data not found. Please try again.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      await signUp(
        pendingRegistration.email, 
        pendingRegistration.password, 
        pendingRegistration.displayName,
        address
      )
      setSuccessMessage('Account created successfully! Please check your email to verify your account.')
      setMode('login')
      setPendingRegistration(null)
      registerForm.reset()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle skipping address (complete registration without address)
  const handleSkipAddress = async () => {
    if (!pendingRegistration) {
      setError('Registration data not found. Please try again.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    try {
      await signUp(
        pendingRegistration.email, 
        pendingRegistration.password, 
        pendingRegistration.displayName
      )
      setSuccessMessage('Account created successfully! Please check your email to verify your account.')
      setMode('login')
      setPendingRegistration(null)
      registerForm.reset()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle going back to registration from address step
  const handleBackToRegister = () => {
    setMode('register')
    setError(null)
    setSuccessMessage(null)
  }

  // Switch modes
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
    setSuccessMessage(null)
    setPendingRegistration(null)
    loginForm.reset()
    registerForm.reset()
    resetForm.reset()
  }

  if (!isOpen) return null

  const titles = {
    login: 'Welcome Back',
    register: 'Create Account', 
    reset: 'Reset Password',
    address: 'Add Your Address'
  }

  const subtitles = {
    login: 'Sign in to your Neighbourhood Watch+ account',
    register: 'Join your local security community',
    reset: 'Enter your email to reset your password',
    address: 'Help us provide better security services (optional)'
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="fixed left-[50%] top-[50%] z-[2001] translate-x-[-50%] translate-y-[-50%] w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              {/* Back button for address mode */}
              {mode === 'address' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackToRegister}
                  className="w-8 h-8 mr-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {titles[mode]}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subtitles[mode]}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-8 h-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {successMessage && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Google Sign In */}
            {mode !== 'reset' && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </div>
              </Button>
            )}

            {/* Divider */}
            {mode !== 'reset' && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                    Or continue with email
                  </span>
                </div>
              </div>
            )}

            {/* Login Form */}
            {mode === 'login' && (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <Label htmlFor="login-email" className="text-sm font-medium mb-2 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...loginForm.register('email')}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="login-password" className="text-sm font-medium mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
                      {...loginForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="link"
                    className="px-0 h-auto text-sm"
                    onClick={() => switchMode('reset')}
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            )}

            {/* Register Form */}
            {mode === 'register' && (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <Label htmlFor="register-name" className="text-sm font-medium mb-2 block">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Enter your full name"
                      className="pl-10"
                      {...registerForm.register('displayName')}
                    />
                  </div>
                  {registerForm.formState.errors.displayName && (
                    <p className="text-red-500 text-xs mt-1">
                      {registerForm.formState.errors.displayName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-email" className="text-sm font-medium mb-2 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...registerForm.register('email')}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-password" className="text-sm font-medium mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      className="pl-10 pr-10"
                      {...registerForm.register('password')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-confirm-password" className="text-sm font-medium mb-2 block">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      className="pl-10 pr-10"
                      {...registerForm.register('confirmPassword')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full w-10"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            )}

            {/* Reset Password Form */}
            {mode === 'reset' && (
              <form onSubmit={resetForm.handleSubmit(handlePasswordReset)} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email" className="text-sm font-medium mb-2 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      {...resetForm.register('email')}
                    />
                  </div>
                  {resetForm.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {resetForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending Email...
                    </div>
                  ) : (
                    'Send Reset Email'
                  )}
                </Button>
              </form>
            )}

            {/* Address Collection Form */}
            {mode === 'address' && (
              <AddressCollectionForm
                onSubmit={handleAddressSubmission}
                onSkip={handleSkipAddress}
                showSkipOption={true}
                submitButtonText="Complete Registration"
                isStandalone={false}
              />
            )}

            {/* Footer Links */}
            {mode !== 'address' && (
              <div className="text-center text-sm">
                {mode === 'login' && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto font-medium"
                      onClick={() => switchMode('register')}
                    >
                      Create one here
                    </Button>
                  </p>
                )}
                
                {mode === 'register' && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto font-medium"
                      onClick={() => switchMode('login')}
                    >
                      Sign in here
                    </Button>
                  </p>
                )}
                
                {mode === 'reset' && (
                  <p className="text-gray-600 dark:text-gray-400">
                    Remember your password?{' '}
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto font-medium"
                      onClick={() => switchMode('login')}
                    >
                      Sign in here
                    </Button>
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
