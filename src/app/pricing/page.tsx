import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for CodeForFood. Pro plan at $4.99/mo and Unlimited at $9.99/mo. 7-day free trial, no credit card required.',
  alternates: {
    canonical: '/pricing',
  },
}

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Can I cancel anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
      },
    },
    {
      "@type": "Question",
      name: "Do you offer refunds?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes! We offer a 30-day money-back guarantee. If you're not satisfied, contact us within 30 days for a full refund.",
      },
    },
    {
      "@type": "Question",
      name: "What payment methods do you accept?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor.",
      },
    },
    {
      "@type": "Question",
      name: "Can I upgrade or downgrade anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the next billing cycle.",
      },
    },
  ],
}

const features = [
  { name: "Organizations", pro: "3", unlimited: "Unlimited" },
  { name: "Projects per org", pro: "5", unlimited: "Unlimited" },
  { name: "Milestones", pro: "Unlimited", unlimited: "Unlimited" },
  { name: "Client sharing links", pro: true, unlimited: true },
  { name: "Fixed, hourly & per-unit billing", pro: true, unlimited: true },
  { name: "Privacy controls", pro: true, unlimited: true },
  { name: "Operating expenses", pro: true, unlimited: true },
  { name: "Attachments & comments", pro: true, unlimited: true },
  { name: "Telegram bot", pro: true, unlimited: true },
  { name: "E2E encrypted notes", pro: true, unlimited: true },
  { name: "Full REST API access", pro: false, unlimited: true },
  { name: "CSV export", pro: true, unlimited: true },
]

export default function PricingPage() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://my.codefor.food"

  return (
    <div className="min-h-dvh relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="aurora" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full py-5 px-4 border-b border-border/30 backdrop-blur-sm bg-background/80">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-accent hover:text-accent-hover transition-colors">
              <Image
                src="/logo.png"
                alt="codeforfood"
                width={24}
                height={24}
                className="size-6"
              />
              <span>codeforfood</span>
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
        <main className="flex-1 px-4 py-20">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/20 text-accent text-sm font-medium mb-6">
                <span className="size-2 rounded-full bg-accent animate-pulse" />
                7-day free trial &mdash; no credit card
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-5">
                <span className="gradient-text">Simple pricing</span>
              </h1>
              <p className="text-muted text-lg max-w-md mx-auto">
                Choose the plan that fits your workload. Upgrade or downgrade anytime.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-20">
              {/* Pro Plan */}
              <div className="bg-card border border-border/60 rounded-2xl p-8 flex flex-col feature-card">
                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Pro</h2>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-bold stat-number">$4.99</span>
                    <span className="text-muted">/month</span>
                  </div>
                  <p className="text-sm text-muted">Perfect for solo freelancers</p>
                </div>

                <ul className="space-y-3.5 mb-8 flex-1">
                  {[
                    { text: "3 organizations", highlight: true },
                    { text: "5 projects per org", highlight: true },
                    { text: "Unlimited milestones" },
                    { text: "Telegram bot" },
                    { text: "E2E encrypted notes" },
                    { text: "CSV export" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="size-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs flex-shrink-0">✓</span>
                      <span className={item.highlight ? "text-foreground" : "text-muted"}>{item.text}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={`${adminUrl}/login`}
                  className="block w-full py-3.5 text-center border border-border/60 rounded-xl hover:border-accent/50 transition-all font-medium mt-auto hover:bg-card-hover"
                >
                  Start Free Trial
                </a>
              </div>

              {/* Unlimited Plan */}
              <div className="pricing-popular rounded-2xl p-8 relative flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-background text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-accent/20">
                    Most Popular
                  </span>
                </div>

                <div className="mb-8">
                  <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Unlimited</h2>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-5xl font-bold gradient-text stat-number">$9.99</span>
                    <span className="text-muted">/month</span>
                  </div>
                  <p className="text-sm text-muted">For growing freelance businesses</p>
                </div>

                <ul className="space-y-3.5 mb-8 flex-1">
                  {[
                    { text: "Unlimited organizations", highlight: true },
                    { text: "Unlimited projects", highlight: true },
                    { text: "Unlimited milestones" },
                    { text: "Telegram bot" },
                    { text: "E2E encrypted notes" },
                    { text: "Full REST API access", highlight: true },
                    { text: "CSV export" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <span className="size-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs flex-shrink-0">✓</span>
                      <span className={item.highlight ? "text-foreground font-medium" : "text-muted"}>{item.text}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={`${adminUrl}/login`}
                  className="btn-glow block w-full py-3.5 text-center bg-accent text-background font-bold rounded-xl hover:bg-accent-hover transition-all mt-auto hover:shadow-lg hover:shadow-accent/20"
                >
                  Start Free Trial
                </a>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-20">
              {[
                { icon: "🔒", text: "Secure payments" },
                { icon: "↩️", text: "30-day money-back" },
                { icon: "⚡", text: "Cancel anytime" },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/80 border border-border/40 text-sm text-muted">
                  <span>{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>

            {/* Feature Comparison Table */}
            <div className="max-w-3xl mx-auto mb-20">
              <h2 className="text-2xl font-bold text-center mb-10">Compare plans</h2>
              <div className="bg-card border border-border/60 rounded-2xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-border/40 text-sm font-semibold">
                  <div className="text-muted">Feature</div>
                  <div className="text-center">Pro</div>
                  <div className="text-center text-accent">Unlimited</div>
                </div>
                {/* Table rows */}
                {features.map((feature, i) => (
                  <div key={i} className={`grid grid-cols-3 gap-4 px-6 py-3.5 text-sm ${i < features.length - 1 ? 'border-b border-border/20' : ''}`}>
                    <div className="text-muted">{feature.name}</div>
                    <div className="text-center">
                      {typeof feature.pro === 'boolean' ? (
                        feature.pro ? (
                          <span className="text-success">✓</span>
                        ) : (
                          <span className="text-muted/30">—</span>
                        )
                      ) : (
                        <span className="font-medium">{feature.pro}</span>
                      )}
                    </div>
                    <div className="text-center">
                      {typeof feature.unlimited === 'boolean' ? (
                        feature.unlimited ? (
                          <span className="text-success">✓</span>
                        ) : (
                          <span className="text-muted/30">—</span>
                        )
                      ) : (
                        <span className="font-medium text-accent">{feature.unlimited}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="max-w-2xl mx-auto mb-20">
              <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>

              <div className="space-y-4">
                <div className="bg-card/80 border border-border/40 rounded-xl p-6 feature-card">
                  <h3 className="font-bold mb-2">Can I cancel anytime?</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Yes, you can cancel your subscription at any time. You&apos;ll continue to have access
                    until the end of your billing period.
                  </p>
                </div>

                <div className="bg-card/80 border border-border/40 rounded-xl p-6 feature-card">
                  <h3 className="font-bold mb-2">Do you offer refunds?</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Yes! We offer a <span className="text-foreground font-medium">30-day money-back guarantee</span>.
                    If you&apos;re not satisfied, contact us within 30 days for a full refund. See our{" "}
                    <Link href="/terms" className="text-accent hover:underline">Terms of Use</Link> for details.
                  </p>
                </div>

                <div className="bg-card/80 border border-border/40 rounded-xl p-6 feature-card">
                  <h3 className="font-bold mb-2">What payment methods do you accept?</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    We accept all major credit cards (Visa, Mastercard, American Express) through our
                    secure payment processor.
                  </p>
                </div>

                <div className="bg-card/80 border border-border/40 rounded-xl p-6 feature-card">
                  <h3 className="font-bold mb-2">Can I upgrade or downgrade anytime?</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Yes, you can change your plan at any time. When upgrading, you&apos;ll be charged
                    the prorated difference. When downgrading, the change takes effect at the next billing cycle.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center relative py-8">
              <div className="absolute inset-0 bg-gradient-to-t from-accent/[0.03] to-transparent pointer-events-none rounded-3xl" />
              <div className="relative">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to get started?</h2>
                <p className="text-muted mb-8">Start your 7-day free trial. No credit card required.</p>
                <a
                  href={`${adminUrl}/login`}
                  className="btn-glow cta-pulse inline-block px-10 py-4 bg-accent text-background font-bold rounded-xl hover:bg-accent-hover transition-all hover:shadow-xl hover:shadow-accent/25 text-lg"
                >
                  Start Free Trial
                </a>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/30 py-8 px-4 bg-background/50 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-accent font-bold hover:opacity-80 transition-opacity">
              <Image
                src="/logo.png"
                alt="codeforfood"
                width={20}
                height={20}
                className="size-5"
              />
              <span>codeforfood</span>
            </Link>
            <div className="flex items-center gap-4 text-xs text-muted/40">
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
