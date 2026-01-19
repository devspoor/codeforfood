import Link from 'next/link'

export default function Home() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://my.codefor.food";

  return (
    <div className="min-h-dvh relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* Header */}
        <header className="w-full py-6 px-4 border-b border-border/50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-accent font-bold text-lg">{"<cff/>"}</div>
            <div className="flex items-center gap-6 text-sm text-muted">
              <Link href="/pricing" className="hover:text-foreground transition-colors">
                Pricing
              </Link>
              <a
                href={`${adminUrl}/login`}
                className="px-4 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent-hover transition-colors"
              >
                Sign In
              </a>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-4 py-16 md:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-xs text-accent mb-6">
                <span className="size-1.5 bg-accent rounded-full" />
                For developers who code for food
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-balance leading-tight">
                Billing tracker
                <br />
                <span className="gradient-text">for freelancers</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-muted mb-8 max-w-2xl text-pretty leading-relaxed">
                Create projects with milestones, track payments, and share progress
                with clients via a single link. No more awkward money conversations.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-8">
                <a
                  href={`${adminUrl}/login`}
                  className="btn-glow px-8 py-4 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover text-lg"
                >
                  Start Free Trial
                </a>
                <div className="flex flex-col text-sm text-muted">
                  <span>14 days free</span>
                  <span className="text-muted/60">Then $3.99/month</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Screenshot Hero */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="relative bg-card border border-border rounded-xl overflow-hidden shadow-2xl shadow-black/50">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border">
                <div className="flex gap-2">
                  <div className="size-3 rounded-full bg-danger/80" />
                  <div className="size-3 rounded-full bg-accent/80" />
                  <div className="size-3 rounded-full bg-success/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="max-w-md mx-auto bg-background/50 rounded px-3 py-1 text-xs text-muted text-center">
                    my.codefor.food/p/acme-redesign
                  </div>
                </div>
              </div>

              {/* Screenshot placeholder */}
              <div className="aspect-video bg-background/50 flex items-center justify-center">
                <div className="text-center text-muted">
                  <div className="size-16 mx-auto mb-4 rounded-lg bg-border/50 flex items-center justify-center">
                    <svg className="size-8 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm">Dashboard Screenshot</p>
                  <p className="text-xs text-muted/50 mt-1">1920 × 1080</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mx-auto text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-balance">
                Sound familiar?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              {[
                {
                  problem: "\"How's the project going?\"",
                  pain: "Endless status update messages from clients"
                },
                {
                  problem: "\"Where do I send payment?\"",
                  pain: "Digging through chats for your own wallet address"
                },
                {
                  problem: "\"How much do I owe you?\"",
                  pain: "Disputes about what was included in the price"
                }
              ].map((item, i) => (
                <div key={i} className="bg-card/50 border border-border rounded-xl p-6">
                  <div className="text-danger text-sm mb-2">✕</div>
                  <h3 className="font-semibold mb-2">{item.problem}</h3>
                  <p className="text-sm text-muted">{item.pain}</p>
                </div>
              ))}
            </div>

            {/* Solution */}
            <div className="bg-card border border-accent/20 rounded-2xl p-8 md:p-12">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent text-lg">✓</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 text-balance">
                    One link — everything your client needs
                  </h3>
                  <p className="text-muted text-pretty">
                    Your client opens the project page and sees: what&apos;s done, what&apos;s in progress,
                    how much is paid, and where to send money. No questions needed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-balance">
                How it works
              </h2>
            </div>

            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-20">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 text-accent text-sm font-medium mb-4">
                  <span className="size-6 rounded-full bg-accent/10 flex items-center justify-center text-xs">1</span>
                  Create a project
                </div>
                <h3 className="text-xl font-bold mb-4 text-balance">
                  Break down work into milestones
                </h3>
                <p className="text-muted mb-6 text-pretty">
                  Fixed price, hourly, or per-unit billing — mix and match as needed.
                  Add private notes, attach Figma and GitHub links, track operating expenses.
                </p>
                <ul className="space-y-3 text-sm">
                  {["Fixed, hourly & per-unit milestones", "E2E encrypted private notes", "Attachments & comments"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted">
                      <span className="text-success">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                {/* Screenshot placeholder */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-background/50 flex items-center justify-center">
                    <div className="text-center text-muted">
                      <div className="size-12 mx-auto mb-3 rounded-lg bg-border/50 flex items-center justify-center">
                        <svg className="size-6 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs">Project Creation Screenshot</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-20">
              <div>
                {/* Screenshot placeholder */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-background/50 flex items-center justify-center">
                    <div className="text-center text-muted">
                      <div className="size-12 mx-auto mb-3 rounded-lg bg-border/50 flex items-center justify-center">
                        <svg className="size-6 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs">Public Project Page Screenshot</p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="inline-flex items-center gap-2 text-accent text-sm font-medium mb-4">
                  <span className="size-6 rounded-full bg-accent/10 flex items-center justify-center text-xs">2</span>
                  Share the link
                </div>
                <h3 className="text-xl font-bold mb-4 text-balance">
                  Client sees everything in real-time
                </h3>
                <p className="text-muted mb-6 text-pretty">
                  Milestone progress, logged hours, amount paid and remaining — all updated live.
                  Client doesn&apos;t need an account, just opens the link.
                </p>
                <ul className="space-y-3 text-sm">
                  {["No client signup required", "Optional: hide amounts", "Password protection available"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted">
                      <span className="text-success">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 text-accent text-sm font-medium mb-4">
                  <span className="size-6 rounded-full bg-accent/10 flex items-center justify-center text-xs">3</span>
                  Track payments
                </div>
                <h3 className="text-xl font-bold mb-4 text-balance">
                  Mark when money arrives
                </h3>
                <p className="text-muted mb-6 text-pretty">
                  Client pays you directly — crypto, bank transfer, PayPal, whatever works.
                  You mark the payment in the tracker. Full history preserved.
                </p>
                <ul className="space-y-3 text-sm">
                  {["Any payment method you use", "Partial payments supported", "Complete payment history"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-muted">
                      <span className="text-success">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="order-1 lg:order-2">
                {/* Screenshot placeholder */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-background/50 flex items-center justify-center">
                    <div className="text-center text-muted">
                      <div className="size-12 mx-auto mb-3 rounded-lg bg-border/50 flex items-center justify-center">
                        <svg className="size-6 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs">Payment Tracking Screenshot</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Milestone Types - Detailed */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-balance">
                Three billing models, one project
              </h2>
              <p className="text-muted max-w-lg mx-auto text-pretty">
                Mix fixed-price deliverables with hourly work and per-unit tasks. Bill however makes sense for the job.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fixed Price */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="size-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="size-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Fixed Price</h3>
                <p className="text-sm text-muted mb-4 text-pretty">
                  Set a fixed amount for a deliverable. &quot;Homepage design — $1,500&quot;. Track partial payments if the client pays in installments.
                </p>
                <div className="bg-background/50 rounded-lg p-4 text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted">Homepage design</span>
                    <span className="tabular-nums">$1,500</span>
                  </div>
                  <div className="flex justify-between text-muted/60">
                    <span>Paid</span>
                    <span className="tabular-nums text-success">$1,000</span>
                  </div>
                </div>
              </div>

              {/* Hourly */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="size-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <svg className="size-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Hourly</h3>
                <p className="text-sm text-muted mb-4 text-pretty">
                  Set your hourly rate and log time entries with descriptions. Total is calculated automatically. Mark individual entries as paid.
                </p>
                <div className="bg-background/50 rounded-lg p-4 text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted">Bug fixes @ $75/hr</span>
                    <span className="tabular-nums">12.5 hrs</span>
                  </div>
                  <div className="flex justify-between text-muted/60">
                    <span>Total</span>
                    <span className="tabular-nums">$937.50</span>
                  </div>
                </div>
              </div>

              {/* Per Unit */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <svg className="size-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Per Unit</h3>
                <p className="text-sm text-muted mb-4 text-pretty">
                  Charge per item: &quot;$50 per blog post&quot;, &quot;$200 per landing page&quot;. Log each unit with a label. Great for content and batch work.
                </p>
                <div className="bg-background/50 rounded-lg p-4 text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted">Blog posts @ $50/each</span>
                    <span className="tabular-nums">8 posts</span>
                  </div>
                  <div className="flex justify-between text-muted/60">
                    <span>Total</span>
                    <span className="tabular-nums">$400</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Client View Features */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-balance">
                  What your client sees
                </h2>
                <p className="text-muted mb-8 text-pretty">
                  A clean, professional project page with everything they need. No signup, no app download — just a link.
                </p>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <svg className="size-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Progress overview</h3>
                      <p className="text-sm text-muted">Total value, amount paid, amount due, and a visual progress bar. Status badges for each milestone.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <svg className="size-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Time logs (for hourly)</h3>
                      <p className="text-sm text-muted">Each logged entry with date, hours worked, and description. Full transparency on where time went.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <svg className="size-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Payment methods</h3>
                      <p className="text-sm text-muted">All your payment options with one-click copy. Crypto wallets, bank details, PayPal — whatever you accept.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="size-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <svg className="size-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Payment history</h3>
                      <p className="text-sm text-muted">Timeline of all payments received with dates and amounts. Client sees exactly what&apos;s been paid.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                {/* Screenshot placeholder */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-background/50 flex items-center justify-center">
                    <div className="text-center text-muted">
                      <div className="size-12 mx-auto mb-3 rounded-lg bg-border/50 flex items-center justify-center">
                        <svg className="size-6 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs">Client View Screenshot</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Controls */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                {/* Screenshot placeholder */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-background/50 flex items-center justify-center">
                    <div className="text-center text-muted">
                      <div className="size-12 mx-auto mb-3 rounded-lg bg-border/50 flex items-center justify-center">
                        <svg className="size-6 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs">Project Settings Screenshot</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-balance">
                  You control what&apos;s visible
                </h2>
                <p className="text-muted mb-8 text-pretty">
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
                    <div key={i} className="flex items-start gap-3">
                      <div className="size-5 rounded bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="size-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm">{item.title}</h3>
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
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="size-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
                    <svg className="size-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-balance">
                    End-to-end encrypted notes
                  </h2>
                  <p className="text-muted mb-6 text-pretty">
                    Keep sensitive project details in encrypted notes. Your encryption password never leaves your device —
                    we literally cannot read your notes, even if we wanted to.
                  </p>
                  <ul className="space-y-3 text-sm">
                    {[
                      "Client secrets and API keys",
                      "Internal cost breakdowns",
                      "Negotiation notes",
                      "Anything you want to keep private"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-muted">
                        <span className="text-success">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-background/50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="size-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm font-medium">Private Note</span>
                  </div>
                  <div className="space-y-2 text-sm text-muted font-mono">
                    <p>Client&apos;s AWS credentials:</p>
                    <p className="text-muted/50">••••••••••••••••••••</p>
                    <p className="mt-4">Actual cost breakdown:</p>
                    <p className="text-muted/50">••••••••••••••••••••</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border">
                    <p className="text-xs text-muted/50">Encrypted with AES-256. Only you can decrypt.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Features */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-balance">
                Your freelance command center
              </h2>
              <p className="text-muted max-w-lg mx-auto text-pretty">
                See all your projects, earnings, and outstanding payments in one dashboard.
              </p>
            </div>

            {/* Screenshot placeholder */}
            <div className="bg-card border border-border rounded-xl overflow-hidden mb-12">
              <div className="aspect-video bg-background/50 flex items-center justify-center">
                <div className="text-center text-muted">
                  <div className="size-16 mx-auto mb-4 rounded-lg bg-border/50 flex items-center justify-center">
                    <svg className="size-8 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm">Dashboard Overview Screenshot</p>
                  <p className="text-xs text-muted/50 mt-1">1920 × 1080</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Total Value", desc: "Sum of all milestones" },
                { label: "Received", desc: "Total amount paid" },
                { label: "Outstanding", desc: "What's still due" },
                { label: "Hours Logged", desc: "Across all hourly work" }
              ].map((stat, i) => (
                <div key={i} className="bg-card/50 border border-border rounded-xl p-4 text-center">
                  <h3 className="font-semibold mb-1">{stat.label}</h3>
                  <p className="text-xs text-muted">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Operating Expenses */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-balance">
                  Track operating expenses
                </h2>
                <p className="text-muted mb-6 text-pretty">
                  Every project has costs: hosting, domains, API subscriptions, stock photos.
                  Log them to see your true profit margin.
                </p>
                <div className="bg-card/50 border border-border rounded-xl p-4 mb-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">Vercel Pro</span>
                      <span className="tabular-nums">$20/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Domain renewal</span>
                      <span className="tabular-nums">$15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Stock images</span>
                      <span className="tabular-nums">$45</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border font-medium">
                      <span>Total expenses</span>
                      <span className="tabular-nums">$80</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted">
                  Optionally show expenses to clients for full transparency, or keep them private.
                </p>
              </div>

              <div>
                {/* Screenshot placeholder */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-[4/3] bg-background/50 flex items-center justify-center">
                    <div className="text-center text-muted">
                      <div className="size-12 mx-auto mb-3 rounded-lg bg-border/50 flex items-center justify-center">
                        <svg className="size-6 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-xs">Operating Expenses Screenshot</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Attachments & Comments */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-balance">
                Keep everything in one place
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Attachments */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="size-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="size-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Attachments</h3>
                <p className="text-sm text-muted mb-4 text-pretty">
                  Link to anything related to the project. Clients see these on the public page.
                </p>
                <div className="space-y-2">
                  {[
                    { icon: "🎨", label: "Figma designs", url: "figma.com/..." },
                    { icon: "📦", label: "GitHub repo", url: "github.com/..." },
                    { icon: "🌐", label: "Staging site", url: "staging.client.com" },
                    { icon: "📄", label: "Project brief", url: "notion.so/..." }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm bg-background/50 rounded-lg px-3 py-2">
                      <span>{item.icon}</span>
                      <span className="text-muted">{item.label}</span>
                      <span className="text-muted/50 text-xs ml-auto truncate">{item.url}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="size-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="size-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-2">Comments</h3>
                <p className="text-sm text-muted mb-4 text-pretty">
                  Post project updates visible to your client. Keep a timeline of progress and decisions.
                </p>
                <div className="space-y-3">
                  {[
                    { date: "Jan 15", text: "Homepage design approved, moving to development" },
                    { date: "Jan 18", text: "Header and footer components complete" },
                    { date: "Jan 22", text: "Deployed to staging for review" }
                  ].map((item, i) => (
                    <div key={i} className="text-sm bg-background/50 rounded-lg px-3 py-2">
                      <span className="text-muted/50 text-xs">{item.date}</span>
                      <p className="text-muted mt-1">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* API Section */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="size-12 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
                    <svg className="size-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-balance">
                    REST API included
                  </h2>
                  <p className="text-muted mb-6 text-pretty">
                    Automate your workflow. Create projects, log time entries, record payments — all via API.
                    Integrate with your invoicing tool, time tracker, or custom scripts.
                  </p>
                  <ul className="space-y-2 text-sm text-muted">
                    <li>• Create and manage projects</li>
                    <li>• Add milestones and time entries</li>
                    <li>• Record payments programmatically</li>
                    <li>• Idempotent endpoints for safe retries</li>
                  </ul>
                </div>
                <div className="bg-background rounded-xl p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-muted/50 mb-2"># Log time entry</div>
                  <div className="text-accent">POST</div>
                  <div className="text-muted">/api/v1/time-entries</div>
                  <div className="mt-4 text-muted/50"># Request body</div>
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
        </section>

        {/* Pricing Section */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-balance">
                Simple pricing
              </h2>
              <p className="text-muted text-pretty">
                One plan, everything included. Cancel anytime.
              </p>
            </div>

            <div className="bg-card border border-accent/30 rounded-2xl p-8 md:p-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-4xl font-bold tabular-nums">$3.99</span>
                    <span className="text-muted">/month</span>
                  </div>
                  <p className="text-sm text-muted">
                    or $39.90/year <span className="text-success">(save 17%)</span>
                  </p>
                </div>
                <a
                  href={`${adminUrl}/login`}
                  className="btn-glow px-8 py-4 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover text-center"
                >
                  Start Free Trial
                </a>
              </div>

              <div className="border-t border-border pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Unlimited projects",
                    "Unlimited milestones",
                    "All billing types (fixed, hourly, per-unit)",
                    "Public shareable links",
                    "E2E encrypted notes",
                    "Any payment methods",
                    "Time tracking",
                    "Operating expenses",
                    "Attachments & comments",
                    "Full API access"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="text-success">✓</span>
                      <span className="text-muted">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted">
                  14 days free. 30-day money-back guarantee.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-balance">
                Questions
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
                  a: "No. Clients just open the link you share and see the project page. No signup, no app download. You can optionally add password protection."
                },
                {
                  q: "Can I hide amounts from clients?",
                  a: "Yes. You can show progress without dollar figures — great for early negotiations. You can also hide payment status and operating expenses."
                },
                {
                  q: "How do encrypted notes work?",
                  a: "Your notes are encrypted with a password you set. The encryption happens in your browser — your password never leaves your device. Even we can't read your notes."
                },
                {
                  q: "What's the difference between fixed, hourly, and per-unit?",
                  a: "Fixed: set price for a deliverable ($500 for logo). Hourly: rate × logged hours ($75/hr × 10 hrs). Per-unit: rate × quantity ($50/post × 8 posts). Mix all three in one project."
                },
                {
                  q: "Is there a free trial?",
                  a: "Yes. 14 days free, no credit card required to start. You can also cancel within 30 days for a full refund."
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Yes. Cancel in one click. You keep access until the end of your billing period."
                }
              ].map((item, i) => (
                <div key={i} className="bg-card/50 border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">{item.q}</h3>
                  <p className="text-sm text-muted text-pretty">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-balance">
              Stop managing projects in chat
            </h2>
            <p className="text-lg text-muted mb-8 max-w-xl mx-auto text-pretty">
              One tool for billing instead of spreadsheets, notes, and message threads.
              Try it free.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <a
                href={`${adminUrl}/login`}
                className="btn-glow px-10 py-4 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover text-lg"
              >
                Start Free Trial
              </a>
            </div>
            <p className="text-sm text-muted/60">
              14-day trial · No credit card · Cancel anytime
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-accent font-bold">{"<codeforfood/>"}</div>
            <div className="flex items-center gap-6 text-xs text-muted/50">
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
