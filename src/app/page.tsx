import Link from 'next/link'
import Image from 'next/image'

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "CodeForFood",
  url: "https://codefor.food",
  description:
    "Create projects with milestones, track payments, and share progress with clients via a single link. Billing tracker built for freelancers.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      name: "Pro",
      price: "4.99",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
    },
    {
      "@type": "Offer",
      name: "Unlimited",
      price: "9.99",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
    },
  ],
};

export default function Home() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://my.codefor.food";

  return (
    <div className="min-h-dvh relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="aurora" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* Header */}
        <header className="w-full py-5 px-4 border-b border-border/30 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
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
            <div className="flex items-center gap-6 text-sm">
              <Link href="/pricing" className="text-muted hover:text-foreground transition-colors hidden sm:block">
                Pricing
              </Link>
              <a
                href={`${adminUrl}/login`}
                className="px-5 py-2.5 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover transition-all hover:shadow-lg hover:shadow-accent/20"
              >
                Start Free
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-4 pt-20 md:pt-32 pb-16 relative">
          <div className="hero-glow" />
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/5 border border-accent/20 text-accent text-sm font-medium mb-8 badge-float">
                <span className="size-2 rounded-full bg-accent animate-pulse" />
                7-day free trial &mdash; no credit card
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
                Stop chasing
                <br />
                <span className="gradient-text">payments</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-muted mb-10 max-w-xl mx-auto text-pretty leading-relaxed">
                Billing tracker for freelancers. Create projects, track milestones, and share a single link with your clients.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <a
                  href={`${adminUrl}/login`}
                  className="btn-glow cta-pulse px-10 py-4 bg-accent text-background font-bold rounded-xl hover:bg-accent-hover text-lg transition-all hover:shadow-xl hover:shadow-accent/25"
                >
                  Start Free Trial
                </a>
                <span className="text-muted text-sm">Then from $4.99/mo</span>
              </div>

              {/* Social proof numbers */}
              <div className="flex items-center justify-center gap-8 sm:gap-12 text-center">
                {[
                  { value: "$2M+", label: "Tracked" },
                  { value: "500+", label: "Projects" },
                  { value: "4.9/5", label: "Rating" },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl sm:text-3xl font-bold number-highlight stat-number">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-muted mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Screenshot Hero */}
        <section className="px-4 pb-20">
          <div className="max-w-5xl mx-auto">
            <div className="relative bg-card border border-border/60 rounded-2xl overflow-hidden shadow-2xl shadow-black/60">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-card/80 border-b border-border/40">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-[#ff5f57]" />
                  <div className="size-3 rounded-full bg-[#febc2e]" />
                  <div className="size-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="max-w-sm mx-auto bg-background/60 rounded-md px-3 py-1.5 text-xs text-muted/60 text-center font-mono">
                    my.codefor.food/p/acme-redesign
                  </div>
                </div>
              </div>

              {/* Screenshot */}
              <div className="aspect-video bg-background/50 flex items-center justify-center overflow-hidden">
                <img
                  src="/dashboard.png"
                  alt="Dashboard Screenshot"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-4">The problem</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
                Sound familiar?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
              {[
                {
                  emoji: "💬",
                  problem: "\"How's the project going?\"",
                  pain: "Endless status update messages from clients who just want to know the progress"
                },
                {
                  emoji: "💸",
                  problem: "\"Where do I send payment?\"",
                  pain: "Digging through chats for your own wallet address or bank details"
                },
                {
                  emoji: "🤷",
                  problem: "\"How much do I owe you?\"",
                  pain: "Disputes about what was included in the price and what's been paid"
                }
              ].map((item, i) => (
                <div key={i} className="bg-card/80 border border-border/60 rounded-2xl p-6 feature-card">
                  <div className="text-2xl mb-3">{item.emoji}</div>
                  <h3 className="font-bold mb-2 text-lg">{item.problem}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.pain}</p>
                </div>
              ))}
            </div>

            {/* Solution */}
            <div className="border-gradient rounded-2xl">
              <div className="bg-card rounded-2xl p-8 md:p-12">
                <div className="flex items-start gap-5">
                  <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-accent text-xl">✓</span>
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 text-balance">
                      One link — everything your client needs
                    </h3>
                    <p className="text-muted text-pretty leading-relaxed text-lg">
                      Your client opens the project page and sees: what&apos;s done, what&apos;s in progress,
                      how much is paid, and where to send money. No questions needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-4">How it works</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-balance">
                Three steps. That&apos;s it.
              </h2>
            </div>

            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center mb-28">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-3 text-accent text-sm font-semibold mb-5">
                  <span className="size-8 rounded-full bg-accent text-background flex items-center justify-center text-sm font-bold">1</span>
                  Create a project
                </div>
                <h3 className="text-2xl font-bold mb-4 text-balance">
                  Break down work into milestones
                </h3>
                <p className="text-muted mb-6 text-pretty leading-relaxed">
                  Fixed price, hourly, or per-unit billing — mix and match as needed.
                  Add private notes, attach Figma and GitHub links, track operating expenses.
                </p>
                <ul className="space-y-3 text-sm">
                  {["Fixed, hourly & per-unit milestones", "E2E encrypted private notes", "Attachments & comments"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="size-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                      <span className="text-muted">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xl shadow-black/30 feature-card">
                  <div className="aspect-[4/3] bg-background/50">
                    <img
                      src="/how1.png"
                      alt="Project Creation Screenshot"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center mb-28">
              <div>
                <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xl shadow-black/30 feature-card">
                  <div className="aspect-[4/3] bg-background/50">
                    <img
                      src="/how2.png"
                      alt="Public Project Page Screenshot"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-3 text-accent text-sm font-semibold mb-5">
                  <span className="size-8 rounded-full bg-accent text-background flex items-center justify-center text-sm font-bold">2</span>
                  Share the link
                </div>
                <h3 className="text-2xl font-bold mb-4 text-balance">
                  Client sees everything in real-time
                </h3>
                <p className="text-muted mb-6 text-pretty leading-relaxed">
                  Milestone progress, logged hours, amount paid and remaining — all updated live.
                  Client doesn&apos;t need an account, just opens the link.
                </p>
                <ul className="space-y-3 text-sm">
                  {["No client signup required", "Optional: hide amounts", "Password protection available"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="size-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                      <span className="text-muted">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-3 text-accent text-sm font-semibold mb-5">
                  <span className="size-8 rounded-full bg-accent text-background flex items-center justify-center text-sm font-bold">3</span>
                  Track payments
                </div>
                <h3 className="text-2xl font-bold mb-4 text-balance">
                  Mark when money arrives
                </h3>
                <p className="text-muted mb-6 text-pretty leading-relaxed">
                  Client pays you directly — crypto, bank transfer, PayPal, whatever works.
                  You mark the payment in the tracker. Full history preserved.
                </p>
                <ul className="space-y-3 text-sm">
                  {["Any payment method you use", "Partial payments supported", "Complete payment history"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="size-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                      <span className="text-muted">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xl shadow-black/30 feature-card">
                  <div className="aspect-[4/3] bg-background/50">
                    <img
                      src="/how3.png"
                      alt="Payment Tracking Screenshot"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Milestone Types */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-4">Flexible billing</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
                Three billing models, one project
              </h2>
              <p className="text-muted max-w-lg mx-auto text-pretty">
                Mix fixed-price deliverables with hourly work and per-unit tasks. Bill however makes sense.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Fixed Price */}
              <div className="bg-card border border-border/60 rounded-2xl p-7 feature-card">
                <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <svg className="size-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Fixed Price</h3>
                <p className="text-sm text-muted mb-5 text-pretty leading-relaxed">
                  Set a fixed amount for a deliverable. Track partial payments if the client pays in installments.
                </p>
                <div className="bg-background/60 rounded-xl p-4 text-sm border border-border/30">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted">Homepage design</span>
                    <span className="tabular-nums font-mono font-medium">$1,500</span>
                  </div>
                  <div className="flex justify-between text-muted/60">
                    <span>Paid</span>
                    <span className="tabular-nums font-mono text-success">$1,000</span>
                  </div>
                </div>
              </div>

              {/* Hourly */}
              <div className="bg-card border border-border/60 rounded-2xl p-7 feature-card">
                <div className="size-12 rounded-xl bg-success/10 flex items-center justify-center mb-5">
                  <svg className="size-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Hourly</h3>
                <p className="text-sm text-muted mb-5 text-pretty leading-relaxed">
                  Set your hourly rate and log time entries with descriptions. Total calculated automatically.
                </p>
                <div className="bg-background/60 rounded-xl p-4 text-sm border border-border/30">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted">Bug fixes @ $75/hr</span>
                    <span className="tabular-nums font-mono font-medium">12.5 hrs</span>
                  </div>
                  <div className="flex justify-between text-muted/60">
                    <span>Total</span>
                    <span className="tabular-nums font-mono">$937.50</span>
                  </div>
                </div>
              </div>

              {/* Per Unit */}
              <div className="bg-card border border-border/60 rounded-2xl p-7 feature-card">
                <div className="size-12 rounded-xl bg-neutral-500/10 flex items-center justify-center mb-5">
                  <svg className="size-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Per Unit</h3>
                <p className="text-sm text-muted mb-5 text-pretty leading-relaxed">
                  Charge per item: &quot;$50 per blog post&quot;, &quot;$200 per landing page&quot;. Great for content work.
                </p>
                <div className="bg-background/60 rounded-xl p-4 text-sm border border-border/30">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted">Blog posts @ $50/each</span>
                    <span className="tabular-nums font-mono font-medium">8 posts</span>
                  </div>
                  <div className="flex justify-between text-muted/60">
                    <span>Total</span>
                    <span className="tabular-nums font-mono">$400</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Client View Features */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-4">Client experience</p>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-balance">
                  What your client sees
                </h2>
                <p className="text-muted mb-8 text-pretty leading-relaxed text-lg">
                  A clean, professional project page. No signup, no app — just a link.
                </p>

                <div className="space-y-5">
                  {[
                    {
                      icon: (
                        <svg className="size-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      ),
                      title: "Progress overview",
                      desc: "Total value, amount paid, amount due, and visual progress bars"
                    },
                    {
                      icon: (
                        <svg className="size-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ),
                      title: "Time logs",
                      desc: "Each entry with date, hours, and description. Full transparency."
                    },
                    {
                      icon: (
                        <svg className="size-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      ),
                      title: "Payment methods",
                      desc: "All your payment options with one-click copy"
                    },
                    {
                      icon: (
                        <svg className="size-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ),
                      title: "Payment history",
                      desc: "Timeline of all payments received with dates and amounts"
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-sm text-muted">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xl shadow-black/30">
                  <div className="aspect-[4/3] bg-background/50">
                    <img
                      src="/clientsees.png"
                      alt="Client View Screenshot"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Controls */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xl shadow-black/30">
                  <div className="aspect-[4/3] bg-background/50">
                    <img
                      src="/control.png"
                      alt="Project Settings Screenshot"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-4">Privacy</p>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-balance">
                  You control what&apos;s visible
                </h2>
                <p className="text-muted mb-8 text-pretty leading-relaxed">
                  Not every client needs to see every detail. Toggle visibility settings per project.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      title: "Hide amounts",
                      desc: "Show progress without dollar figures — useful during negotiations"
                    },
                    {
                      title: "Hide payment info",
                      desc: "Keep paid/unpaid status private until you're ready to share"
                    },
                    {
                      title: "Password protection",
                      desc: "Require a password to view the project page"
                    },
                    {
                      title: "Hide operating expenses",
                      desc: "Keep your project costs to yourself"
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 bg-card/50 border border-border/30 rounded-xl p-4 feature-card">
                      <div className="size-5 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="size-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{item.title}</h3>
                        <p className="text-sm text-muted">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Encrypted Notes */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-6xl mx-auto">
            <div className="border-gradient rounded-2xl">
              <div className="bg-card rounded-2xl p-8 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  <div>
                    <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                      <svg className="size-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-balance">
                      End-to-end encrypted notes
                    </h2>
                    <p className="text-muted mb-6 text-pretty leading-relaxed">
                      Keep sensitive project details encrypted. Your password never leaves your device —
                      we literally cannot read your notes.
                    </p>
                    <ul className="space-y-3 text-sm">
                      {[
                        "Client secrets and API keys",
                        "Internal cost breakdowns",
                        "Negotiation notes",
                        "Anything you want private"
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <span className="size-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                          <span className="text-muted">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-background/60 rounded-xl p-6 border border-border/30">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="size-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-sm font-medium">Private Note</span>
                      <span className="text-xs text-accent/50 ml-auto">AES-256</span>
                    </div>
                    <div className="space-y-2 text-sm text-muted font-mono">
                      <p>Client&apos;s AWS credentials:</p>
                      <p className="text-muted/40">••••••••••••••••••••</p>
                      <p className="mt-4">Actual cost breakdown:</p>
                      <p className="text-muted/40">••••••••••••••••••••</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-border/30">
                      <p className="text-xs text-muted/40">Encrypted with AES-256. Only you can decrypt.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Features */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-4">Dashboard</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
                Your freelance command center
              </h2>
              <p className="text-muted max-w-lg mx-auto text-pretty">
                See all your projects, earnings, and outstanding payments at a glance.
              </p>
            </div>

            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden mb-10 shadow-xl shadow-black/30">
              <div className="aspect-video bg-background/50">
                <img
                  src="/commandcenter.png"
                  alt="Dashboard Overview Screenshot"
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Value", desc: "Sum of all milestones", color: "text-foreground" },
                { label: "Received", desc: "Total amount paid", color: "text-success" },
                { label: "Outstanding", desc: "What's still due", color: "text-accent" },
                { label: "Hours Logged", desc: "Across all hourly work", color: "text-foreground" }
              ].map((stat, i) => (
                <div key={i} className="bg-card/80 border border-border/40 rounded-xl p-5 text-center feature-card">
                  <h3 className={`font-bold text-lg mb-1 ${stat.color}`}>{stat.label}</h3>
                  <p className="text-xs text-muted">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Operating Expenses */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-4">Profitability</p>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-balance">
                  Track operating expenses
                </h2>
                <p className="text-muted mb-6 text-pretty leading-relaxed">
                  Every project has costs: hosting, domains, API subscriptions, stock photos.
                  Log them to see your true profit margin.
                </p>
                <div className="bg-card/80 border border-border/40 rounded-xl p-5 mb-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Vercel Pro</span>
                      <span className="tabular-nums font-mono">$20/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Domain renewal</span>
                      <span className="tabular-nums font-mono">$15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Stock images</span>
                      <span className="tabular-nums font-mono">$45</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border/40 font-semibold">
                      <span>Total expenses</span>
                      <span className="tabular-nums font-mono text-danger">$80</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted">
                  Optionally show expenses to clients or keep them private.
                </p>
              </div>

              <div>
                <div className="bg-card border border-border/60 rounded-2xl overflow-hidden shadow-xl shadow-black/30">
                  <div className="aspect-[4/3] bg-background/50">
                    <img
                      src="/expenses.png"
                      alt="Operating Expenses Screenshot"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Attachments & Comments */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-4">Organization</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
                Keep everything in one place
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Attachments */}
              <div className="bg-card border border-border/60 rounded-2xl p-7 feature-card">
                <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <svg className="size-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Attachments</h3>
                <p className="text-sm text-muted mb-5 text-pretty">
                  Link to anything related to the project. Clients see these on the public page.
                </p>
                <div className="space-y-2">
                  {[
                    { icon: "🎨", label: "Figma designs", url: "figma.com/..." },
                    { icon: "📦", label: "GitHub repo", url: "github.com/..." },
                    { icon: "🌐", label: "Staging site", url: "staging.client.com" },
                    { icon: "📄", label: "Project brief", url: "notion.so/..." }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm bg-background/50 rounded-lg px-3 py-2.5 border border-border/20">
                      <span>{item.icon}</span>
                      <span className="text-muted">{item.label}</span>
                      <span className="text-muted/40 text-xs ml-auto truncate font-mono">{item.url}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-card border border-border/60 rounded-2xl p-7 feature-card">
                <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <svg className="size-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Comments</h3>
                <p className="text-sm text-muted mb-5 text-pretty">
                  Post project updates visible to your client. Keep a timeline of decisions.
                </p>
                <div className="space-y-3">
                  {[
                    { date: "Jan 15", text: "Homepage design approved, moving to development" },
                    { date: "Jan 18", text: "Header and footer components complete" },
                    { date: "Jan 22", text: "Deployed to staging for review" }
                  ].map((item, i) => (
                    <div key={i} className="text-sm bg-background/50 rounded-lg px-3 py-2.5 border border-border/20">
                      <span className="text-muted/40 text-xs font-mono">{item.date}</span>
                      <p className="text-muted mt-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* API Section */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-6xl mx-auto">
            <div className="border-gradient rounded-2xl">
              <div className="bg-card rounded-2xl p-8 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  <div>
                    <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6">
                      <svg className="size-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-balance">
                      REST API included
                    </h2>
                    <p className="text-muted mb-6 text-pretty leading-relaxed">
                      Automate your workflow. Create projects, log time, record payments — all via API.
                      Integrate with your existing tools.
                    </p>
                    <ul className="space-y-2 text-sm text-muted">
                      <li className="flex items-center gap-2"><span className="text-accent">&#8250;</span> Create and manage projects</li>
                      <li className="flex items-center gap-2"><span className="text-accent">&#8250;</span> Add milestones and time entries</li>
                      <li className="flex items-center gap-2"><span className="text-accent">&#8250;</span> Record payments programmatically</li>
                      <li className="flex items-center gap-2"><span className="text-accent">&#8250;</span> Idempotent endpoints for safe retries</li>
                    </ul>
                  </div>
                  <div className="bg-background/80 rounded-xl p-5 font-mono text-sm overflow-x-auto border border-border/30">
                    <div className="text-muted/40 mb-2"># Log time entry</div>
                    <div className="text-accent font-semibold">POST</div>
                    <div className="text-muted">/api/v1/time-entries</div>
                    <div className="mt-4 text-muted/40"># Request body</div>
                    <pre className="text-muted">{`{
  "milestone_id": "...",
  "hours": 2.5,
  "description": "Bug fixes",
  "date": "2024-01-15"
}`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-4">Pricing</p>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-balance">
                Simple, transparent pricing
              </h2>
              <p className="text-muted text-pretty text-lg">
                7-day free trial. No credit card required.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Pro */}
              <div className="bg-card border border-border/60 rounded-2xl p-7 md:p-8 flex flex-col feature-card">
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Pro</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tabular-nums">$4.99</span>
                    <span className="text-muted text-sm">/month</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 text-sm flex-1">
                  {[
                    { text: "3 organizations", bold: "3" },
                    { text: "5 projects per org", bold: "5" },
                    { text: "Telegram bot" },
                    { text: "All features" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="size-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                      <span className="text-muted">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`${adminUrl}/login`}
                  className="block w-full py-3.5 text-center border border-border/60 rounded-xl hover:border-accent/50 transition-all text-sm font-medium mt-auto hover:bg-card-hover"
                >
                  Start Free Trial
                </a>
              </div>

              {/* Unlimited */}
              <div className="pricing-popular rounded-2xl p-7 md:p-8 relative flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent text-background text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-accent/20">
                    Most Popular
                  </span>
                </div>
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">Unlimited</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tabular-nums gradient-text">$9.99</span>
                    <span className="text-muted text-sm">/month</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8 text-sm flex-1">
                  {[
                    { text: "Unlimited organizations" },
                    { text: "Unlimited projects" },
                    { text: "Telegram bot" },
                    { text: "Full API access" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="size-5 rounded-full bg-success/10 text-success flex items-center justify-center text-xs">✓</span>
                      <span className="text-muted">{item.text}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={`${adminUrl}/login`}
                  className="btn-glow block w-full py-3.5 text-center bg-accent text-background font-bold rounded-xl hover:bg-accent-hover transition-all text-sm mt-auto hover:shadow-lg hover:shadow-accent/20"
                >
                  Start Free Trial
                </a>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted">
              <span className="trust-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                30-day money-back guarantee
              </span>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-24 section-glow">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-accent text-sm font-semibold tracking-wide uppercase mb-4">FAQ</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-balance">
                Questions &amp; Answers
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Do payments go through you?",
                  a: "No. Clients pay you directly — bank transfer, crypto, PayPal, whatever you use. We just help you track what's been paid and what's outstanding."
                },
                {
                  q: "Does my client need an account?",
                  a: "No. Clients just open the link you share. No signup, no app download. You can optionally add password protection."
                },
                {
                  q: "Can I hide amounts from clients?",
                  a: "Yes. Show progress without dollar figures — great for early negotiations. You can also hide payment status and expenses."
                },
                {
                  q: "How do encrypted notes work?",
                  a: "Your notes are encrypted in your browser with a password you set. The password never leaves your device. Even we can't read your notes."
                },
                {
                  q: "What's fixed vs hourly vs per-unit?",
                  a: "Fixed: set price for a deliverable ($500 for logo). Hourly: rate × logged hours ($75/hr × 10 hrs). Per-unit: rate × quantity ($50/post × 8 posts). Mix all three in one project."
                },
                {
                  q: "Is there a free trial?",
                  a: "Yes! 7-day free trial on every plan. No credit card required. After the trial, choose the plan that fits."
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes. Cancel in one click. You keep access until the end of your billing period."
                }
              ].map((item, i) => (
                <div key={i} className="bg-card/80 border border-border/40 rounded-xl p-6 feature-card">
                  <h3 className="font-bold mb-2">{item.q}</h3>
                  <p className="text-sm text-muted text-pretty leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-28 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-accent/[0.03] to-transparent pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center relative">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-balance leading-tight">
              Stop managing
              <br />
              <span className="gradient-text">projects in chat</span>
            </h2>
            <p className="text-lg text-muted mb-10 max-w-xl mx-auto text-pretty">
              One tool for billing instead of spreadsheets, notes, and message threads.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <a
                href={`${adminUrl}/login`}
                className="btn-glow cta-pulse px-12 py-4 bg-accent text-background font-bold rounded-xl hover:bg-accent-hover text-lg transition-all hover:shadow-xl hover:shadow-accent/25"
              >
                Start Free Trial
              </a>
            </div>
            <p className="text-sm text-muted/50">
              7-day free trial · No credit card · Cancel anytime
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/30 py-8 px-4 bg-background/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
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
            <div className="flex items-center gap-6 text-xs text-muted/40">
              <Link href="/pricing" className="hover:text-muted transition-colors">
                Pricing
              </Link>
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
  );
}
