import React from 'react'
import { Users, Heart, Shield, AlertCircle, CheckCircle, XCircle, MessageSquare, Eye } from 'lucide-react'

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Community Guidelines
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Standards for safe, respectful, and effective neighbourhood security coordination
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 space-y-10">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Heart className="w-6 h-6 text-purple-600" />
              Our Community Values
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Neighbourhood Watch Plus is built on the principle that neighbours working together create safer, 
                stronger communities. These guidelines help ensure our platform remains a positive space focused 
                on genuine security cooperation.
              </p>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mt-4">
                <p className="text-purple-800 dark:text-purple-200 mb-0">
                  <strong>Remember:</strong> This platform handles real security concerns that affect real people's 
                  safety and peace of mind. Your actions here have consequences beyond the app.
                </p>
              </div>
            </div>
          </section>

          {/* Core Principles */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-purple-600" />
              Core Principles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Safety First
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All platform use should genuinely contribute to community safety and security.
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-green-600" />
                    Privacy Respect
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Protect neighbours' privacy and only share information when appropriate.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600" />
                    Community Spirit
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Treat neighbours with respect, kindness, and understanding.
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    Accurate Information
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Share only truthful, verified information about security matters.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Positive Behaviors */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Encouraged Behaviors
            </h2>
            <div className="space-y-6">
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">Camera Management</h3>
                <ul className="list-disc pl-6 space-y-2 text-green-700 dark:text-green-300">
                  <li>Register only cameras you actually own and control</li>
                  <li>Keep camera status accurate (online/offline/maintenance)</li>
                  <li>Respond promptly to legitimate footage requests</li>
                  <li>Update your availability and settings regularly</li>
                  <li>Report technical issues that affect community safety</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">Community Interaction</h3>
                <ul className="list-disc pl-6 space-y-2 text-blue-700 dark:text-blue-300">
                  <li>Make footage requests for genuine security concerns</li>
                  <li>Provide clear, specific details when requesting footage</li>
                  <li>Thank neighbours who help with your requests</li>
                  <li>Share relevant safety information with the community</li>
                  <li>Participate constructively in platform discussions</li>
                </ul>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3">Building Trust</h3>
                <ul className="list-disc pl-6 space-y-2 text-purple-700 dark:text-purple-300">
                  <li>Complete the camera verification process honestly</li>
                  <li>Maintain a helpful and reliable reputation</li>
                  <li>Report suspicious platform activity to administrators</li>
                  <li>Help new community members understand the platform</li>
                  <li>Use the platform consistently and responsibly</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Prohibited Behaviors */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <XCircle className="w-6 h-6 text-red-600" />
              Prohibited Behaviors
            </h2>
            <div className="space-y-6">
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">False Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="list-disc pl-6 space-y-1 text-red-700 dark:text-red-300 text-sm">
                    <li>Registering cameras you don't own</li>
                    <li>Providing fake addresses or identity</li>
                    <li>Creating false security incidents</li>
                    <li>Submitting fraudulent footage requests</li>
                  </ul>
                  <ul className="list-disc pl-6 space-y-1 text-red-700 dark:text-red-300 text-sm">
                    <li>Spreading rumors or misinformation</li>
                    <li>Exaggerating security threats</li>
                    <li>Making false accusations against neighbours</li>
                    <li>Providing misleading camera specifications</li>
                  </ul>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-3">Privacy Violations</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="list-disc pl-6 space-y-1 text-orange-700 dark:text-orange-300 text-sm">
                    <li>Sharing others' personal information publicly</li>
                    <li>Recording in private areas without permission</li>
                    <li>Distributing footage beyond stated purpose</li>
                    <li>Using platform data for non-security purposes</li>
                  </ul>
                  <ul className="list-disc pl-6 space-y-1 text-orange-700 dark:text-orange-300 text-sm">
                    <li>Stalking or harassing other users</li>
                    <li>Taking screenshots of private conversations</li>
                    <li>Sharing camera locations with non-users</li>
                    <li>Violating GDPR or data protection laws</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Platform Misuse</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                    <li>Commercial use without permission</li>
                    <li>Spam or unsolicited communications</li>
                    <li>Attempting to hack or exploit the service</li>
                    <li>Creating multiple accounts</li>
                  </ul>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300 text-sm">
                    <li>Circumventing security measures</li>
                    <li>Using automated tools or bots</li>
                    <li>Interfering with other users' access</li>
                    <li>Reverse engineering platform features</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Reporting Guidelines */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-purple-600" />
              Reporting and Enforcement
            </h2>
            <div className="space-y-6">
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">When to Report</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                    <li>Suspected fake cameras or fraudulent accounts</li>
                    <li>Inappropriate or harassing behavior</li>
                    <li>Privacy violations or data misuse</li>
                    <li>Spam or commercial solicitation</li>
                    <li>Platform security vulnerabilities</li>
                    <li>Threats or intimidation</li>
                  </ul>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">How to Report</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                    <li>Use the "Report" button on user profiles or content</li>
                    <li>Email: reports@neighbourhoodwatchplus.co.uk</li>
                    <li>Provide specific details and evidence</li>
                    <li>Include timestamps and user IDs when possible</li>
                    <li>For urgent safety issues, also contact police</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">Enforcement Actions</h3>
                <p className="text-amber-700 dark:text-amber-300 mb-3">
                  Violations may result in the following actions, depending on severity:
                </p>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-200 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MessageSquare className="w-6 h-6 text-yellow-800 dark:text-yellow-200" />
                    </div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">Warning</h4>
                    <p className="text-amber-700 dark:text-amber-300">First-time minor violations</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-200 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-2">
                      <AlertCircle className="w-6 h-6 text-orange-800 dark:text-orange-200" />
                    </div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">Restriction</h4>
                    <p className="text-amber-700 dark:text-amber-300">Temporary limits on features</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-red-200 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-2">
                      <XCircle className="w-6 h-6 text-red-800 dark:text-red-200" />
                    </div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">Suspension</h4>
                    <p className="text-amber-700 dark:text-amber-300">Temporary account disable</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">Permanent Ban</h4>
                    <p className="text-amber-700 dark:text-amber-300">Serious or repeated violations</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Emergency Procedures */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Emergency and Safety Procedures
            </h2>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">🚨 Immediate Emergencies</h3>
                <p className="text-red-700 dark:text-red-300 mb-3">
                  <strong>For crimes in progress, medical emergencies, or immediate threats:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-red-700 dark:text-red-300">
                  <li><strong>Call 999 immediately</strong> - Don't rely solely on the platform</li>
                  <li>Request footage only after ensuring immediate safety</li>
                  <li>Follow police instructions about evidence preservation</li>
                  <li>Share relevant platform information with responding officers</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">Non-Emergency Security Concerns</h3>
                <ul className="list-disc pl-6 space-y-2 text-blue-700 dark:text-blue-300">
                  <li>Use the platform to coordinate with neighbours</li>
                  <li>Contact police non-emergency line (101) for suspicious activity</li>
                  <li>Document incidents thoroughly before requesting footage</li>
                  <li>Respect others' judgment about sharing footage</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Appeals Process */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Appeals and Dispute Resolution
            </h2>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you believe you've been unfairly penalized or want to dispute a decision:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Email appeals@neighbourhoodwatchplus.co.uk within 14 days</li>
                <li>Include your account details and explanation</li>
                <li>Provide any supporting evidence</li>
                <li>Our team will review within 5 business days</li>
                <li>You'll receive a written response with our decision</li>
              </ol>
              <p className="text-sm text-gray-500 mt-4">
                For serious disputes, you may also contact the relevant ombudsman or seek independent legal advice.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Questions and Support
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Need clarification on these guidelines or have suggestions for improvement?
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">General Questions</h4>
                  <p className="text-gray-600 dark:text-gray-400">support@neighbourhoodwatchplus.co.uk</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Report Violations</h4>
                  <p className="text-gray-600 dark:text-gray-400">reports@neighbourhoodwatchplus.co.uk</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Appeals</h4>
                  <p className="text-gray-600 dark:text-gray-400">appeals@neighbourhoodwatchplus.co.uk</p>
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>These guidelines help create a safe, respectful community. Thank you for being part of Neighbourhood Watch Plus.</p>
          <p className="mt-2">Together, we make our communities safer.</p>
        </div>
      </div>
    </div>
  )
}
