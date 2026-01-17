import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing | CodeForFood',
  description: 'Simple, transparent pricing for CodeForFood - Project billing tracker for freelancers',
}

export default function PricingPage() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://my.codefor.food"

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full py-6 px-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-accent font-bold text-lg hover:opacity-80 transition-opacity">
              {"<cff/>"}
            </Link>
            <a
              href={`${adminUrl}/login`}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sign In
            </a>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                <span className="gradient-text">Simple pricing</span>
              </h1>
              <p className="text-muted text-lg max-w-md mx-auto">
                One plan, all features. No hidden fees.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Monthly Plan */}
              <div className="card-glow bg-card border border-border rounded-2xl p-8">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-muted mb-2">Monthly</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">$3.99</span>
                    <span className="text-muted">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unlimited projects</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unlimited milestones</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Public sharing links</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>E2E encrypted notes</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Payment method display</span>
                  </li>
                </ul>

                <a
                  href={`${adminUrl}/login`}
                  className="block w-full py-3 px-4 text-center border border-border rounded-lg hover:border-accent/50 transition-colors"
                >
                  Get Started
                </a>
              </div>

              {/* Yearly Plan */}
              <div className="card-glow bg-card border-2 border-accent rounded-2xl p-8 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-background text-xs font-semibold px-3 py-1 rounded-full">
                    Save 17%
                  </span>
                </div>

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-muted mb-2">Yearly</h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold gradient-text">$39.90</span>
                    <span className="text-muted">/year</span>
                  </div>
                  <p className="text-sm text-muted mt-1">$3.33/month</p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unlimited projects</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unlimited milestones</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Public sharing links</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>E2E encrypted notes</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <svg className="w-5 h-5 text-success flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Payment method display</span>
                  </li>
                </ul>

                <a
                  href={`${adminUrl}/login`}
                  className="btn-glow block w-full py-3 px-4 text-center bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover transition-colors"
                >
                  Get Started
                </a>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-20 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>

              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                  <p className="text-sm text-muted">
                    Yes, you can cancel your subscription at any time. You&apos;ll continue to have access
                    until the end of your billing period.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
                  <p className="text-sm text-muted">
                    Yes! We offer a <span className="text-foreground font-medium">30-day money-back guarantee</span>.
                    If you&apos;re not satisfied, contact us within 30 days for a full refund. See our{" "}
                    <Link href="/terms" className="text-accent hover:underline">Terms of Use</Link> for details.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
                  <p className="text-sm text-muted">
                    We accept all major credit cards (Visa, Mastercard, American Express) through our
                    secure payment processor.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">Is there a free trial?</h3>
                  <p className="text-sm text-muted">
                    We don&apos;t offer a free trial, but with our affordable pricing you can try the
                    full service for less than the cost of a coffee.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-20 text-center">
              <p className="text-muted mb-4">Ready to start tracking your projects?</p>
              <a
                href={`${adminUrl}/login`}
                className="btn-glow inline-block px-8 py-3.5 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover"
              >
                Get Started Now
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="text-accent font-bold hover:opacity-80 transition-opacity">
              {"<codeforfood/>"}
            </Link>
            <div className="flex items-center gap-4 text-xs text-muted/50">
              <Link href="/privacy" className="hover:text-muted transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-muted transition-colors">
                Terms
              </Link>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted">
              <a href={`${adminUrl}/login`} className="hover:text-foreground transition-colors">
                Sign In
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
