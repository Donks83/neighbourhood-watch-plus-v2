import React from 'react'
import { Scale, FileText, Shield, AlertTriangle, Users, CheckCircle } from 'lucide-react'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-6">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Legal agreement governing your use of Neighbourhood Watch Plus
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
          
          {/* Agreement */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-green-600" />
              1. Agreement to Terms
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p>
                By accessing or using Neighbourhood Watch Plus ("the Service", "our platform"), you agree to be bound 
                by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not use the Service.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you and Neighbourhood Watch Plus Limited, 
                a company registered in England and Wales. The Service is intended for use within the United Kingdom 
                and is governed by English law.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
                <p className="text-red-800 dark:text-red-200 mb-0">
                  <strong>Important:</strong> This service involves community security coordination. Misuse could 
                  impact public safety. Please read these terms carefully and use the platform responsibly.
                </p>
              </div>
            </div>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              2. Eligibility and Account Requirements
            </h2>
            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Who Can Use This Service</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>You must be at least 18 years old</li>
                  <li>You must be a UK resident with a verifiable UK address</li>
                  <li>You must provide accurate and truthful information</li>
                  <li>You must have legal authority to register cameras at your stated address</li>
                  <li>One account per person (no shared or business accounts for security cameras)</li>
                </ul>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Account Security</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>You are responsible for maintaining the security of your account credentials</li>
                  <li>You must notify us immediately of any unauthorized access</li>
                  <li>You are liable for all activities that occur under your account</li>
                  <li>We may require additional verification for security-sensitive actions</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              3. Acceptable Use Policy
            </h2>
            <div className="space-y-6">
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">Permitted Uses</h3>
                <ul className="list-disc pl-6 space-y-2 text-green-700 dark:text-green-300">
                  <li>Registering legitimately owned security cameras at your property</li>
                  <li>Coordinating with neighbours for community safety purposes</li>
                  <li>Requesting footage for legitimate security incidents</li>
                  <li>Sharing information about local security concerns</li>
                  <li>Participating constructively in community discussions</li>
                </ul>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">Prohibited Uses</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">False Information</h4>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-red-700 dark:text-red-300">
                      <li>Registering cameras you don't own</li>
                      <li>Providing false addresses or identity</li>
                      <li>Creating fake security incidents</li>
                      <li>Submitting fraudulent footage requests</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Privacy Violations</h4>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-red-700 dark:text-red-300">
                      <li>Sharing others' personal information</li>
                      <li>Recording in prohibited locations</li>
                      <li>Distributing private footage publicly</li>
                      <li>Stalking or harassment via platform</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Misuse of Platform</h4>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-red-700 dark:text-red-300">
                      <li>Commercial use without permission</li>
                      <li>Spam or unsolicited communications</li>
                      <li>Attempting to hack or exploit the service</li>
                      <li>Circumventing security measures</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Legal Violations</h4>
                    <ul className="list-disc pl-4 space-y-1 text-sm text-red-700 dark:text-red-300">
                      <li>Any illegal activity</li>
                      <li>Violating GDPR or data protection laws</li>
                      <li>Copyright or trademark infringement</li>
                      <li>Discrimination or hate speech</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Camera Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-600" />
              4. Camera Registration and Verification
            </h2>
            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Registration Requirements</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>You must own or have explicit permission to register each camera</li>
                  <li>Cameras must be located at your verified address or adjacent property you control</li>
                  <li>You must comply with UK privacy laws and local regulations</li>
                  <li>Camera specifications must be accurate (resolution, night vision, etc.)</li>
                  <li>You must maintain cameras in working order if marked as "active"</li>
                </ul>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Verification Process</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We may verify your cameras through various methods to ensure platform integrity:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Photo evidence of camera installation</li>
                  <li>Address verification against council tax records</li>
                  <li>Remote testing of camera functionality</li>
                  <li>Community member verification reports</li>
                  <li>Third-party verification services</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footage Requests */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              5. Footage Requests and Sharing
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">Making Requests</h3>
                <ul className="list-disc pl-6 space-y-2 text-blue-700 dark:text-blue-300">
                  <li>Requests must be for legitimate security purposes only</li>
                  <li>Provide specific time windows and detailed reason for request</li>
                  <li>Respect camera owners' approval requirements and time restrictions</li>
                  <li>Do not request footage for civil disputes or non-security matters</li>
                </ul>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3">Sharing Footage</h3>
                <ul className="list-disc pl-6 space-y-2 text-purple-700 dark:text-purple-300">
                  <li>You retain ownership of your camera footage at all times</li>
                  <li>Sharing is entirely voluntary - you may decline any request</li>
                  <li>Shared footage must be relevant to the stated security concern</li>
                  <li>Recipients may only use footage for the stated purpose</li>
                  <li>Do not share footage containing identifiable third parties unless necessary</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Platform Rules */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              6. Community Interaction Rules
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Communication Standards</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                  <li>Be respectful and constructive in all interactions</li>
                  <li>Focus on security and safety topics</li>
                  <li>Protect others' privacy and personal information</li>
                  <li>Report genuine security concerns promptly</li>
                  <li>Avoid speculation or unsubstantiated claims</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trust and Reputation</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                  <li>Build trust through consistent, helpful participation</li>
                  <li>Respond promptly to legitimate footage requests</li>
                  <li>Maintain accurate camera status and availability</li>
                  <li>Report platform abuse or suspicious activity</li>
                  <li>Participate in good faith with community safety goals</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Legal Compliance */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              7. Legal Compliance and Law Enforcement
            </h2>
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">Your Legal Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-2 text-amber-700 dark:text-amber-300">
                  <li>Comply with UK data protection laws (UK GDPR, DPA 2018)</li>
                  <li>Follow local council regulations for security cameras</li>
                  <li>Respect neighbours' privacy rights and property boundaries</li>
                  <li>Obtain necessary permissions for camera installations</li>
                  <li>Report serious crimes directly to police, not just the platform</li>
                </ul>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Law Enforcement Cooperation</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We cooperate with law enforcement within legal bounds:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>We may provide user information in response to valid warrants or court orders</li>
                  <li>We facilitate direct contact between police and camera owners when requested</li>
                  <li>We maintain audit logs for security incident investigations</li>
                  <li>We report suspected illegal activity as required by law</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Liability and Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              8. Liability and Disclaimers
            </h2>
            <div className="space-y-4">
              <div className="border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3">Service Limitations</h3>
                <ul className="list-disc pl-6 space-y-2 text-amber-700 dark:text-amber-300">
                  <li>This platform is a coordination tool, not a professional security service</li>
                  <li>We cannot guarantee the accuracy, availability, or quality of user-provided information</li>
                  <li>Camera owners are not obligated to share footage or respond to requests</li>
                  <li>The service may be unavailable due to maintenance, technical issues, or other factors</li>
                  <li>Community-generated content reflects individual opinions, not our views</li>
                </ul>
              </div>
              <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">Limitation of Liability</h3>
                <p className="text-red-700 dark:text-red-300 text-sm mb-3">
                  To the fullest extent permitted by law:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-red-700 dark:text-red-300 text-sm">
                  <li>We are not liable for any indirect, incidental, or consequential damages</li>
                  <li>Our total liability is limited to £100 or the amount you paid in the last 12 months</li>
                  <li>We are not responsible for third-party actions, including other users</li>
                  <li>You use the service at your own risk and discretion</li>
                  <li>This does not limit liability for death, personal injury, or fraud</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              9. Account Termination
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">You May Terminate</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                  <li>Delete your account at any time through settings</li>
                  <li>Stop using the service without notice</li>
                  <li>Request data deletion under GDPR rights</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">We May Terminate</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                  <li>Accounts that violate these Terms</li>
                  <li>Suspected fraudulent or illegal activity</li>
                  <li>Inactive accounts after 2 years notice</li>
                  <li>Accounts posing security risks to others</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                Upon termination, your camera registrations will be removed from the community map within 48 hours. 
                You may request a copy of your data before deletion.
              </p>
            </div>
          </section>

          {/* Changes and Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              10. Changes to Terms and Governing Law
            </h2>
            <div className="space-y-4">
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Updates to These Terms</h3>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  We may update these Terms from time to time. When we do:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>We'll email you about significant changes at least 30 days in advance</li>
                  <li>Minor changes will be posted with an updated date</li>
                  <li>Continued use constitutes acceptance of new terms</li>
                  <li>You may terminate your account if you disagree with changes</li>
                </ul>
              </div>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Governing Law and Disputes</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>These Terms are governed by the laws of England and Wales</li>
                  <li>Disputes will be resolved in English courts</li>
                  <li>We encourage contacting us directly before legal action</li>
                  <li>Some disputes may be eligible for alternative dispute resolution</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              11. Contact Information
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Questions about these Terms? Contact us:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Legal Team:</strong> legal@neighbourhoodwatchplus.co.uk</p>
                <p><strong>General Support:</strong> support@neighbourhoodwatchplus.co.uk</p>
                <p><strong>Company:</strong> Neighbourhood Watch Plus Limited</p>
                <p><strong>Registration:</strong> [Company Number], England and Wales</p>
                <p><strong>Address:</strong> [Your Company Address, UK]</p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>By using Neighbourhood Watch Plus, you acknowledge that you have read, understood, and agree to these Terms of Service.</p>
        </div>
      </div>
    </div>
  )
}
