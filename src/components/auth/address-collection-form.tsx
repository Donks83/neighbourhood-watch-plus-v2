'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Home, Building, Mail as MailIcon, Globe, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { validateAddress, geocodeAddress, validateUKPostcode } from '@/lib/geocoding'
import type { UserAddress } from '@/types/camera'

// Validation schema for address form
const addressSchema = z.object({
  street: z.string().min(1, 'Street address is required').min(3, 'Street address must be at least 3 characters'),
  city: z.string().min(1, 'City is required').min(2, 'City must be at least 2 characters'),
  postcode: z.string().min(1, 'Postcode is required').refine(
    (postcode) => validateUKPostcode(postcode),
    { message: 'Please enter a valid UK postcode (e.g., SW1A 1AA)' }
  ),
  country: z.string().min(1, 'Country is required').default('United Kingdom')
})

type AddressFormData = z.infer<typeof addressSchema>

interface AddressCollectionFormProps {
  onSubmit: (address: UserAddress) => Promise<void>
  onSkip?: () => void
  initialData?: Partial<UserAddress>
  showSkipOption?: boolean
  submitButtonText?: string
  className?: string
  isStandalone?: boolean // Whether this is used outside of registration flow
}

export default function AddressCollectionForm({
  onSubmit,
  onSkip,
  initialData,
  showSkipOption = false,
  submitButtonText = 'Save Address',
  className = '',
  isStandalone = false
}: AddressCollectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      street: initialData?.street || '',
      city: initialData?.city || '',
      postcode: initialData?.postcode || '',
      country: initialData?.country || 'United Kingdom'
    }
  })

  // Handle form submission
  const handleSubmit = async (data: AddressFormData) => {
    setIsSubmitting(true)
    setIsGeocoding(true)
    setError(null)
    setGeocodingStatus('idle')

    try {
      // Validate address data
      const validation = validateAddress(data)
      if (!validation.isValid) {
        throw new Error(`Address validation failed: ${validation.errors.join(', ')}`)
      }

      // Geocode the address
      const addressString = `${data.street}, ${data.city}, ${data.postcode}, ${data.country}`
      console.log('🌍 Geocoding address:', addressString)
      
      const coordinates = await geocodeAddress(addressString)
      
      if (!coordinates) {
        setGeocodingStatus('error')
        throw new Error('Could not find coordinates for this address. Please check the address details and try again.')
      }

      setGeocodingStatus('success')
      console.log('✅ Address geocoded successfully:', coordinates)

      // Create complete address object
      const completeAddress: UserAddress = {
        street: data.street.trim(),
        city: data.city.trim(),
        postcode: data.postcode.trim().toUpperCase(),
        country: data.country.trim(),
        coordinates,
        isVerified: false
      }

      // Submit the address
      await onSubmit(completeAddress)
      
    } catch (err: any) {
      console.error('❌ Error submitting address:', err)
      setError(err.message || 'Failed to save address. Please try again.')
      setGeocodingStatus('error')
    } finally {
      setIsSubmitting(false)
      setIsGeocoding(false)
    }
  }

  // Handle skip option
  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Header (only show if standalone) */}
      {isStandalone && (
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Add Your Address
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Help us provide better community security services
          </p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Geocoding Status */}
      {geocodingStatus === 'success' && (
        <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            Address verified and location found successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Address Form */}
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        
        {/* Street Address */}
        <div>
          <Label htmlFor="street" className="text-sm font-medium mb-2 block">
            Street Address
          </Label>
          <div className="relative">
            <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="street"
              type="text"
              placeholder="e.g., Westerleigh Avenue or 12 Westerleigh Avenue"
              className="pl-10"
              {...form.register('street')}
            />
          </div>
          {form.formState.errors.street && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.street.message}
            </p>
          )}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md px-3 py-2 mt-2">
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">💡 Address Tip</p>
              <p>
                If your full address (with house number) doesn't geocode correctly, 
                try using just the street name without the house number for better accuracy.
              </p>
            </div>
          </div>
        </div>

        {/* City */}
        <div>
          <Label htmlFor="city" className="text-sm font-medium mb-2 block">
            City / Town
          </Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="city"
              type="text"
              placeholder="e.g., London"
              className="pl-10"
              {...form.register('city')}
            />
          </div>
          {form.formState.errors.city && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.city.message}
            </p>
          )}
        </div>

        {/* Postcode */}
        <div>
          <Label htmlFor="postcode" className="text-sm font-medium mb-2 block">
            Postcode
          </Label>
          <div className="relative">
            <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="postcode"
              type="text"
              placeholder="e.g., SW1A 1AA"
              className="pl-10 uppercase"
              {...form.register('postcode')}
              onChange={(e) => {
                // Auto-format postcode to uppercase
                const value = e.target.value.toUpperCase()
                form.setValue('postcode', value)
              }}
            />
          </div>
          {form.formState.errors.postcode && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.postcode.message}
            </p>
          )}
        </div>

        {/* Country */}
        <div>
          <Label htmlFor="country" className="text-sm font-medium mb-2 block">
            Country
          </Label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="country"
              type="text"
              placeholder="United Kingdom"
              className="pl-10"
              {...form.register('country')}
              readOnly
            />
          </div>
          {form.formState.errors.country && (
            <p className="text-red-500 text-xs mt-1">
              {form.formState.errors.country.message}
            </p>
          )}
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Privacy Notice</p>
              <p>
                Your exact address is kept private and only used to center the map on your property. 
                The community sees approximate camera locations for security purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                {isGeocoding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying Address...
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                )}
              </div>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                {submitButtonText}
              </>
            )}
          </Button>

          {/* Skip Button */}
          {showSkipOption && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Skip for Now
            </Button>
          )}
        </div>

        {/* Additional Info */}
        {showSkipOption && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            You can add your address later in your profile settings
          </p>
        )}
      </form>
    </div>
  )
}
