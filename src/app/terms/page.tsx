import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms of Use for CodeForFood — rules and conditions for using the service.',
  alternates: {
    canonical: '/terms',
  },
}

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8 sm:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Use</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: January 17, 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-600">
              By accessing or using CodeForFood (codefor.food), operated by PE Volodko Anton, you agree to be bound
              by these Terms of Use. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-600">
              CodeForFood is a project billing tracker for freelancers. The Service allows you to track
              project milestones, share progress with clients, and manage billing. We reserve the right
              to modify, suspend, or discontinue any part of the Service at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
            <p className="text-gray-600 mb-4">To use certain features of the Service, you must:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Register using Google authentication</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account</li>
              <li>Be at least 16 years old</li>
            </ul>
            <p className="text-gray-600 mt-4">
              You are responsible for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-600 mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Use the Service for any illegal purpose</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on the rights of others</li>
              <li>Upload malicious code or attempt to compromise the Service</li>
              <li>Interfere with other users&apos; use of the Service</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Use the Service to send spam or unsolicited communications</li>
              <li>Misrepresent your identity or affiliation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Your Content</h2>
            <p className="text-gray-600 mb-4">
              You retain ownership of all content you create, upload, or store through the Service
              (&quot;Your Content&quot;). By using the Service, you grant us a limited license to store,
              process, and display Your Content solely for the purpose of providing the Service.
            </p>
            <p className="text-gray-600">
              You are solely responsible for Your Content and must ensure it does not violate any
              third-party rights or applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Payment Terms</h2>
            <p className="text-gray-600 mb-4">
              Certain features of the Service may require payment. By subscribing to paid features:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>You agree to pay all applicable fees</li>
              <li>We may change pricing with reasonable notice</li>
              <li>You authorize us to charge your payment method</li>
            </ul>
            <p className="text-gray-600 mt-4">
              All payments are processed securely through our third-party payment provider.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Refund Policy</h2>
            <p className="text-gray-600 mb-4">
              We offer a <strong>30-day money-back guarantee</strong> for all subscription purchases.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">7.1 Eligibility</h3>
            <p className="text-gray-600 mb-4">
              To be eligible for a refund, you must request it within 30 days from the date of your original purchase.
              Refund requests made after 30 days will not be processed.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">7.2 How to Request a Refund</h3>
            <p className="text-gray-600 mb-4">
              To request a refund, please contact us at{" "}
              <a href="mailto:support@codefor.food" className="text-blue-600 hover:underline">support@codefor.food</a>{" "}
              with your account email and reason for the refund request.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">7.3 Refund Processing</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Card refunds typically take 3-5 business days to appear in your account</li>
              <li>PayPal refunds typically appear within 48 hours</li>
              <li>Refunds will be credited to the original payment method</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">7.4 Non-Refundable Situations</h3>
            <p className="text-gray-600 mb-4">
              Refunds may be refused in cases of:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Requests made after 30 days from purchase</li>
              <li>Evidence of fraud or refund abuse</li>
              <li>Violation of these Terms of Use</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">7.5 Cancellation</h3>
            <p className="text-gray-600">
              You may cancel your subscription at any time. If you cancel after the 30-day refund period,
              you will continue to have access to paid features until the end of your current billing period,
              after which your account will revert to the free tier. No partial refunds will be issued for
              cancellations made after the 30-day period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Payment Processing</h2>
            <p className="text-gray-600">
              Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant
              of Record for all our orders. Paddle provides all customer service inquiries and handles returns.
              For more information, please see{" "}
              <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Paddle&apos;s Checkout Buyer Terms
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Intellectual Property</h2>
            <p className="text-gray-600">
              The Service, including its design, features, and content (excluding Your Content),
              is owned by PE Volodko Anton and is protected by intellectual property laws.
              You may not copy, modify, distribute, or reverse engineer any part of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Disclaimer of Warranties</h2>
            <p className="text-gray-600">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
              ERROR-FREE, OR SECURE. USE OF THE SERVICE IS AT YOUR OWN RISK.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
            <p className="text-gray-600">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PE VOLODKO ANTON SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
              PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA,
              USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
            <p className="text-gray-600">
              You agree to indemnify and hold harmless PE Volodko Anton from any claims, damages,
              losses, or expenses (including legal fees) arising from your use of the Service,
              your violation of these Terms, or your violation of any rights of another party.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Termination</h2>
            <p className="text-gray-600 mb-4">
              We may suspend or terminate your account at any time for violation of these Terms
              or for any other reason at our sole discretion. You may terminate your account
              at any time by contacting us.
            </p>
            <p className="text-gray-600">
              Upon termination, your right to use the Service will immediately cease. Provisions
              that by their nature should survive termination will remain in effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Governing Law</h2>
            <p className="text-gray-600">
              These Terms shall be governed by and construed in accordance with the laws of Ukraine,
              without regard to its conflict of law provisions. Any disputes arising from these Terms
              or the Service shall be resolved in the courts of Ukraine.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Changes to Terms</h2>
            <p className="text-gray-600">
              We reserve the right to modify these Terms at any time. We will notify users of
              significant changes by posting the updated Terms on this page and updating the
              &quot;Last updated&quot; date. Your continued use of the Service after changes constitutes
              acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">16. Severability</h2>
            <p className="text-gray-600">
              If any provision of these Terms is found to be unenforceable or invalid, that provision
              will be limited or eliminated to the minimum extent necessary, and the remaining
              provisions will remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">17. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="text-gray-600">
              <strong>PE Volodko Anton</strong><br />
              Email: <a href="mailto:support@codefor.food" className="text-blue-600 hover:underline">support@codefor.food</a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-4 text-sm">
          <Link href="/privacy" className="text-blue-600 hover:underline">
            Privacy Policy
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/" className="text-blue-600 hover:underline">
            &larr; Back to CodeForFood
          </Link>
        </div>
      </div>
    </div>
  )
}
