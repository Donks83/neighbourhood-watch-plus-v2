import React from 'react'
import { Shield, MapPin, Camera, Users, Eye, Lock, FileText, Mail } from 'lucide-react'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            How Neighbourhood Watch Plus collects, uses, and protects your personal data
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
              <FileText className="w-6 h-6 text-blue-600" />
              1. Introduction
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                Neighbourhood Watch Plus ("we", "our", or "us") is committed to protecting your privacy and ensuring 
                the security of your personal data. This Privacy Policy explains how we collect, use, store, and 
                protect your information when you use our community security platform.
              </p>
              <p>
                We are the data controller for the personal data we process about you. Our registered office is 
                located in the United Kingdom, and we comply with the UK General Data Protection Regulation (UK GDPR) 
                and the Data Protection Act 2018.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                <p className="text-blue-800 dark:text-blue-200 mb-0">
                  <strong>Important:</strong> Our service involves the collection and sharing of location data and 
                  security camera information within your local community. Please read this policy carefully to 
                  understand how your data is used.
                </p>
              </div>
            </div>
          </section>

          {/* Data We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <MapPin className="w-6 h-6 text-blue-600" />
              2. Information We Collect
            </h2>
            <div className="space-y-6">
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Account Information
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Name and email address</li>
                  <li>Profile photo (optional)</li>
                  <li>Home address (for map centering and community verification)</li>
                  <li>Phone number (for account security and notifications)</li>
                  <li>Account preferences and settings</li>
                </ul>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-600" />
                  Camera and Security Data
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Camera locations (exact coordinates for your use, fuzzy locations shared with community)</li>
                  <li>Camera specifications (resolution, capabilities)</li>
                  <li>Camera status (online/offline/maintenance)</li>
                  <li>Privacy settings and sharing preferences</li>
                  <li>Footage request history and responses</li>
                  <li>Verification status and evidence submissions</li>
                </ul>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-3">
                  <p className="text-amber-800 dark:text-amber-200 text-sm mb-0">
                    <strong>Privacy Protection:</strong> Your exact camera locations are never shared with the community. 
                    We use cryptographic techniques to generate randomized "fuzzy" locations within a safe radius for 
                    community visibility while keeping your actual positions private.
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Usage and Community Data
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Community interactions and requests</li>
                  <li>App usage patterns and feature utilization</li>
                  <li>Technical data (IP address, device type, browser information)</li>
                  <li>Location data for map services and community matching</li>
                  <li>Communication logs for support requests</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Legal Basis */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-blue-600" />
              3. Legal Basis for Processing
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Under UK GDPR, we process your personal data based on the following lawful bases:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Consent (Article 6(1)(a))</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Camera location sharing, community participation, and optional features
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Contract (Article 6(1)(b))</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Account creation, service provision, and platform functionality
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Legitimate Interest (Article 6(1)(f))</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Platform security, fraud prevention, and service improvement
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Legal Obligation (Article 6(1)(c))</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Compliance with law enforcement requests where legally required
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How We Use Data */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              4. How We Use Your Information
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Core Service Functions</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Providing community security mapping and camera coordination</li>
                  <li>Facilitating footage requests between community members</li>
                  <li>Verifying camera authenticity and user trustworthiness</li>
                  <li>Generating privacy-protected community heat maps</li>
                  <li>Enabling secure communication between neighbours</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Platform Improvement</h3>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  <li>Analyzing usage patterns to improve features</li>
                  <li>Developing better security and privacy protections</li>
                  <li>Enhancing community matching algorithms</li>
                  <li>Identifying and preventing misuse or fraud</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. Data Sharing and Disclosure
            </h2>
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">What We Share with Your Community</h3>
                <ul className="list-disc pl-6 space-y-1 text-green-700 dark:text-green-300 text-sm">
                  <li>Fuzzy camera locations (randomized within safe radius)</li>
                  <li>Your public profile information (name, verification status)</li>
                  <li>Camera availability for footage requests (if you opt-in)</li>
                  <li>Community safety statistics (anonymized)</li>
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">What We Never Share</h3>
                <ul className="list-disc pl-6 space-y-1 text-red-700 dark:text-red-300 text-sm">
                  <li>Exact camera coordinates or your precise home location</li>
                  <li>Camera footage or recordings</li>
                  <li>Private messages or sensitive account information</li>
                  <li>Individual usage patterns or personal data</li>
                </ul>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Third-Party Disclosures</h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  We may share limited data with: map service providers (for location services), 
                  authentication services (for account security), cloud hosting providers (for data storage), 
                  and law enforcement (only when legally required by valid warrant or court order).
                </p>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. Data Retention
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="border border-gray-200 dark:border-gray-700 p-3 text-left font-semibold">Data Type</th>
                    <th className="border border-gray-200 dark:border-gray-700 p-3 text-left font-semibold">Retention Period</th>
                    <th className="border border-gray-200 dark:border-gray-700 p-3 text-left font-semibold">Reason</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">Account Information</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">Until account deletion + 30 days</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">Service provision and backup recovery</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">Camera Locations</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">Until camera removal + 90 days</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">Community safety mapping</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">Usage Logs</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">12 months</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">Security monitoring and service improvement</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">Communication Records</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">24 months</td>
                    <td className="border border-gray-200 dark:border-gray-700 p-3">Dispute resolution and compliance</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Your Rights Under UK GDPR
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Access (Article 15)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Request a copy of your personal data</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Rectification (Article 16)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Correct inaccurate or incomplete data</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Erasure (Article 17)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Request deletion of your personal data</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Portability (Article 20)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Export your data in machine-readable format</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Restriction (Article 18)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Limit how we process your data</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Objection (Article 21)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Object to processing based on legitimate interests</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Withdraw Consent</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Remove consent for optional features</p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Complain</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Contact the ICO if you're unsatisfied</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                To exercise any of these rights, please contact us using the details in Section 10. 
                We will respond within one month of receiving your request.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              8. Data Security
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                We implement appropriate technical and organizational measures to protect your personal data:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Encryption</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All data encrypted in transit (TLS 1.3) and at rest (AES-256)
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Access Controls</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Role-based access, multi-factor authentication, regular audits
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Infrastructure</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    UK-based servers, regular backups, disaster recovery plans
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. International Data Transfers
            </h2>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-amber-800 dark:text-amber-200">
                Your personal data is primarily stored and processed within the United Kingdom. Where we need to 
                transfer data internationally (e.g., for cloud services), we ensure appropriate safeguards are in place, 
                including adequacy decisions or Standard Contractual Clauses approved by the UK authorities.
              </p>
            </div>
          </section>

          {/* Contact Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-blue-600" />
              10. Contact Us
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Data Protection Officer:</strong> privacy@neighbourhoodwatchplus.co.uk</p>
                <p><strong>Support Team:</strong> support@neighbourhoodwatchplus.co.uk</p>
                <p><strong>Postal Address:</strong> [Your Company Address, UK]</p>
                <p><strong>ICO Registration:</strong> [Your ICO Registration Number]</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500">
                  You also have the right to lodge a complaint with the Information Commissioner's Office (ICO). 
                  Visit <a href="https://ico.org.uk" className="text-blue-600 hover:underline">ico.org.uk</a> or call 0303 123 1113.
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>This Privacy Policy is effective as of the date shown above and may be updated from time to time.</p>
          <p className="mt-2">We will notify you of significant changes via email or platform notification.</p>
        </div>
      </div>
    </div>
  )
}
