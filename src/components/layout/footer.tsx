import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">Neighbourhood Watch Plus</h3>
            <p className="text-gray-400 text-sm">
              Community security coordination platform for the United Kingdom.
            </p>
          </div>
          
          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className="text-gray-400 hover:text-white transition-colors">
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:support@neighbourhoodwatchplus.co.uk" className="text-gray-400 hover:text-white transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <a href="mailto:reports@neighbourhoodwatchplus.co.uk" className="text-gray-400 hover:text-white transition-colors">
                  Report Issues
                </a>
              </li>
              <li>
                <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                  ICO (Data Protection)
                </a>
              </li>
            </ul>
          </div>
          
          {/* Emergency */}
          <div>
            <h4 className="font-semibold mb-4">Emergency</h4>
            <div className="text-sm text-gray-400">
              <p className="mb-2">For emergencies:</p>
              <p className="text-red-400 font-bold text-lg">Call 999</p>
              <p className="mt-2">Non-emergency: 101</p>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Neighbourhood Watch Plus Limited. All rights reserved.</p>
          <p className="mt-2">Registered in England and Wales. Compliant with UK GDPR and Data Protection Act 2018.</p>
        </div>
      </div>
    </footer>
  )
}
