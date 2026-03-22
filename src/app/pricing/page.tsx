import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for codeforfood. Pro plan at $4.99/mo and Unlimited at $9.99/mo. 7-day free trial, no credit card required.',
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

export default function PricingPage() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://my.codefor.food"

  return (
    <div className="min-h-dvh relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full py-4 px-4 border-b border-border/50 bg-background/80 backdrop-blur-lg">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-accent hover:text-accent-hover">
              <Image src="/logo.png" alt="codeforfood" width={24} height={24} className="size-6" />
              <span>codeforfood</span>
            </Link>
            <a
              href={`${adminUrl}/login`}
              className="px-4 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent-hover transition-colors text-sm"
            >
              Sign In
            </a>
          </div>
        </header>

        <main className="flex-1 px-4 py-20">
          <div className="max-w-5xl mx-auto">
            {/* Title */}
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Pricing
              </h1>
              <p className="text-muted text-lg">
                7-day trial, no card required. Both plans include every feature — the difference is limits.
              </p>
            </div>

            {/* Cards */}
            <div className="grid md:grid-cols-2 gap-px bg-border/50 rounded-xl overflow-hidden max-w-3xl mx-auto mb-6">
              {/* Pro */}
              <div className="bg-card p-8 md:p-10 flex flex-col hover:bg-card-hover transition-colors">
                <p className="mono-tag mb-5">Pro</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold price-tag">$4.99</span>
                  <span className="text-muted">/mo</span>
                </div>
                <p className="text-sm text-muted mb-8">For freelancers getting started.</p>

                <div className="space-y-3 text-sm mb-10 flex-1">
                  <div className="flex justify-between">
                    <span className="text-muted">Organizations</span>
                    <span className="font-medium font-mono">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Projects per org</span>
                    <span className="font-medium font-mono">5</span>
                  </div>
                  <div className="h-px bg-border/50 my-1" />
                  <div className="flex justify-between">
                    <span className="text-muted">Milestones</span>
                    <span className="text-muted/60">unlimited</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Client sharing</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">All billing models</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Privacy controls</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Encrypted notes</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Telegram bot</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">CSV export</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">REST API</span>
                    <span className="text-muted/30">&mdash;</span>
                  </div>
                </div>

                <a
                  href={`${adminUrl}/login`}
                  className="block w-full py-3 text-center border border-border rounded-lg hover:border-accent/50 transition-colors text-sm"
                >
                  Start trial
                </a>
              </div>

              {/* Unlimited */}
              <div className="bg-card p-8 md:p-10 flex flex-col relative hover:bg-card-hover transition-colors">
                <div className="absolute top-6 right-6 md:top-8 md:right-8">
                  <span className="text-xs font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">popular</span>
                </div>

                <p className="mono-tag mb-5">Unlimited</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-5xl font-bold price-tag gradient-text">$9.99</span>
                  <span className="text-muted">/mo</span>
                </div>
                <p className="text-sm text-muted mb-8">No limits on anything.</p>

                <div className="space-y-3 text-sm mb-10 flex-1">
                  <div className="flex justify-between">
                    <span className="text-muted">Organizations</span>
                    <span className="font-medium font-mono text-accent">&infin;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Projects</span>
                    <span className="font-medium font-mono text-accent">&infin;</span>
                  </div>
                  <div className="h-px bg-border/50 my-1" />
                  <div className="flex justify-between">
                    <span className="text-muted">Milestones</span>
                    <span className="text-muted/60">unlimited</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Client sharing</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">All billing models</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Privacy controls</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Encrypted notes</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Telegram bot</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">CSV export</span>
                    <span className="text-success">&#10003;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">REST API</span>
                    <span className="text-success font-medium">&#10003;</span>
                  </div>
                </div>

                <a
                  href={`${adminUrl}/login`}
                  className="block w-full py-3 text-center bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover transition-colors text-sm"
                >
                  Start trial
                </a>
              </div>
            </div>

            {/* One liner */}
            <p className="text-sm text-muted/40 mb-24 text-center max-w-3xl mx-auto">
              30-day money-back guarantee. Upgrade or downgrade anytime.
            </p>

            {/* FAQ */}
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-bold mb-8 text-center">Questions</h2>

              <div className="divide-y divide-border/30">
                <div className="pb-6">
                  <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Yes. One click. You keep access until the end of your billing period.
                  </p>
                </div>

                <div className="py-6">
                  <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    30-day money-back guarantee. Not happy — we refund, no questions.
                    See <Link href="/terms" className="text-accent hover:underline underline-offset-4">Terms</Link> for details.
                  </p>
                </div>

                <div className="py-6">
                  <h3 className="font-semibold mb-2">What payment methods?</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Visa, Mastercard, Amex through our payment processor.
                  </p>
                </div>

                <div className="pt-6">
                  <h3 className="font-semibold mb-2">Can I switch plans?</h3>
                  <p className="text-sm text-muted leading-relaxed">
                    Anytime. Upgrading charges the prorated difference. Downgrading kicks in at the next billing cycle.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-20 pt-16 border-t border-border/50 max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Ready?</h2>
              <p className="text-muted mb-6">7 days free, then pick a plan.</p>
              <a
                href={`${adminUrl}/login`}
                className="inline-block px-8 py-3.5 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover transition-all hover:shadow-[0_0_30px_rgba(250,204,21,0.3)]"
              >
                Start trial
              </a>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-12 px-4 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 text-accent font-bold hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="codeforfood" width={20} height={20} className="size-5" />
              <span>codeforfood</span>
            </Link>
            <div className="flex items-center gap-4 text-xs text-muted/50">
              <Link href="/privacy" className="hover:text-muted transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-muted transition-colors">Terms</Link>
            </div>
            <a href={`${adminUrl}/login`} className="text-sm text-muted hover:text-foreground transition-colors">
              Sign In
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
