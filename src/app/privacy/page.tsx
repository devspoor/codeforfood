import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for CodeForFood — how we collect, use, and protect your data.',
  alternates: {
    canonical: '/privacy',
  },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 17, 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              This Privacy Policy explains how PE Volodko Anton (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;),
              operating as CodeForFood, collects, uses, and protects your personal information when you use
              our website at codefor.food (the &quot;Service&quot;).
            </p>
            <p className="text-gray-600">
              CodeForFood is a project billing tracker for freelancers that helps you track milestones,
              share progress with clients, and get paid faster.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Account Information</h3>
            <p className="text-gray-600 mb-4">
              When you sign up using Google authentication, we collect:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Your email address</li>
              <li>Your name (as provided by Google)</li>
              <li>Your profile picture (if available)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 Usage Data</h3>
            <p className="text-gray-600 mb-4">
              We automatically collect information about how you interact with our Service, including:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Pages visited and features used</li>
              <li>Time and date of your visits</li>
              <li>Device and browser information</li>
              <li>IP address</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.3 Project Data</h3>
            <p className="text-gray-600">
              We store the project information, milestones, and billing data you create within the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use your information to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Provide and maintain the Service</li>
              <li>Process your transactions and payments</li>
              <li>Send you important updates about the Service</li>
              <li>Respond to your support requests</li>
              <li>Improve and optimize our Service</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Cookies</h2>
            <p className="text-gray-600 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Keep you signed in</li>
              <li>Remember your preferences</li>
              <li>Analyze how our Service is used</li>
            </ul>
            <p className="text-gray-600">
              You can control cookies through your browser settings. Note that disabling cookies may
              affect the functionality of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Payment Processing</h2>
            <p className="text-gray-600">
              We use third-party payment processors to handle payments. We do not store your full
              credit card information on our servers. Payment data is handled securely by our
              payment provider in accordance with industry standards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Sharing</h2>
            <p className="text-gray-600 mb-4">We do not sell your personal information. We may share your data with:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Service providers who assist in operating our Service (hosting, analytics, payment processing)</li>
              <li>Law enforcement when required by law</li>
              <li>Third parties with your explicit consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Data Security</h2>
            <p className="text-gray-600">
              We implement appropriate technical and organizational measures to protect your personal
              information against unauthorized access, alteration, disclosure, or destruction. However,
              no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="text-gray-600 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
            <p className="text-gray-600">
              We retain your personal information for as long as your account is active or as needed
              to provide you services. You can request deletion of your account and associated data
              at any time by contacting us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-gray-600">
              Our Service is not intended for children under 16 years of age. We do not knowingly
              collect personal information from children under 16.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about this Privacy Policy, please contact us at:
            </p>
            <p className="text-gray-600">
              <strong>PE Volodko Anton</strong><br />
              Email: <a href="mailto:support@codefor.food" className="text-blue-600 hover:underline">support@codefor.food</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            &larr; Back to CodeForFood
          </Link>
        </div>
      </div>
    </div>
  )
}
