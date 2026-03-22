import Link from 'next/link'
import Image from 'next/image'

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "codeforfood",
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

      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full px-4 pt-4 pb-2">
          <nav className="w-fit mx-auto flex items-center gap-5 px-5 py-2.5 rounded-full border border-border/50 bg-card/80 backdrop-blur-xl shadow-lg shadow-black/20">
            <Link href="/" className="flex items-center gap-2 font-bold text-accent hover:text-accent-hover transition-colors">
              <Image src="/logo.png" alt="codeforfood" width={20} height={20} className="size-5" />
              <span className="text-sm">codeforfood</span>
            </Link>
            <div className="w-px h-4 bg-border/50" />
            <Link href="/pricing" className="text-sm text-muted hover:text-foreground transition-colors">
              Pricing
            </Link>
            <a
              href={`${adminUrl}/login`}
              className="px-4 py-1.5 bg-accent text-background font-medium rounded-full hover:bg-accent-hover transition-colors text-sm"
            >
              Sign In
            </a>
          </nav>
        </header>

        {/* Hero */}
        <section className="relative px-4 pt-24 md:pt-36 pb-20">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-accent/[0.04] rounded-full blur-[100px] pointer-events-none" />

          <div className="relative max-w-4xl mx-auto text-center mb-16 md:mb-20">
            <p className="mono-tag mb-5 animate-fade-in">for freelancers who bill clients</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.05] tracking-tight stagger-1">
              Your client asks
              <br />
              <span className="text-accent">&quot;how much do I owe you?&quot;</span>
              <br />
              You send a link.
            </h1>
            <p className="text-lg md:text-xl text-muted mb-10 max-w-2xl mx-auto leading-relaxed stagger-2">
              Milestones, payments, hours, expenses — one page your client can open
              anytime instead of messaging you.
            </p>
            <div className="flex flex-col items-center gap-3 stagger-3">
              <a
                href={`${adminUrl}/login`}
                className="w-full max-w-md px-8 py-4 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover text-lg transition-all hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] text-center block"
              >
                Try free for 7 days
              </a>
              <span className="text-sm text-muted/60">No card. From $4.99/mo after.</span>
            </div>
          </div>

          <div className="relative max-w-5xl mx-auto">
            <div className="screenshot-frame bg-card">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-[#ff5f57]" />
                  <div className="size-3 rounded-full bg-[#febc2e]" />
                  <div className="size-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="max-w-xs mx-auto bg-background/50 rounded px-3 py-1 text-xs text-muted/50 text-center font-mono">
                    my.codefor.food/p/acme-redesign
                  </div>
                </div>
              </div>
              <div className="aspect-video bg-background/50 overflow-hidden">
                <img src="/dashboard.png" alt="Dashboard" className="w-full h-full object-cover object-top" />
              </div>
            </div>
          </div>
        </section>

        {/* The problem — conversational, not a formula */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                You probably recognize this
              </h2>
              <p className="text-muted leading-relaxed">
                A client asks where to send payment, you dig through Telegram for your wallet.
                They ask what&apos;s left to pay — you open a spreadsheet. They want a status update — you type it out manually.
                Every single time.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 rounded-xl overflow-hidden mb-16">
              {[
                {
                  q: "\"How's the project going?\"",
                  detail: "You stop what you're doing to write a status update in the chat. Again."
                },
                {
                  q: "\"Where do I send payment?\"",
                  detail: "Scrolling through messages looking for your own bank details or wallet address."
                },
                {
                  q: "\"Wait, I thought that was included?\"",
                  detail: "No written record of what was agreed. Now it's your word against theirs."
                }
              ].map((item, i) => (
                <div key={i} className="bg-card p-6 hover:bg-card-hover transition-colors">
                  <h3 className="font-semibold mb-2 text-foreground">{item.q}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="accent-bar max-w-2xl">
              <p className="text-lg">
                <span className="text-foreground font-medium">codeforfood replaces all of this with one link.</span>{" "}
                <span className="text-muted">
                  Your client opens it and sees everything: progress, amounts, where to pay. You don&apos;t explain anything twice.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* How it works — step by step with screenshots */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-20">
              How it works
            </h2>

            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-24">
              <div className="order-2 lg:order-1">
                <p className="mono-tag mb-4">Step 1</p>
                <h3 className="text-xl font-bold mb-4">
                  Create a project, add milestones
                </h3>
                <p className="text-muted mb-6 leading-relaxed">
                  Fixed price, hourly, or per-unit — mix in one project. Attach Figma links, add private encrypted notes, track your costs.
                </p>
                <div className="space-y-2 text-sm text-muted">
                  <p>→ &quot;Homepage design&quot; — $1,500 fixed</p>
                  <p>→ &quot;Bug fixes&quot; — $75/hr</p>
                  <p>→ &quot;Blog posts&quot; — $50 each</p>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="screenshot-frame bg-card">
                  <div className="aspect-[4/3] bg-background/50">
                    <img src="/how1.png" alt="Project creation" className="w-full h-full object-cover object-top" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-24">
              <div>
                <div className="screenshot-frame bg-card">
                  <div className="aspect-[4/3] bg-background/50">
                    <img src="/how2.png" alt="Public project page" className="w-full h-full object-cover object-top" />
                  </div>
                </div>
              </div>
              <div>
                <p className="mono-tag mb-4">Step 2</p>
                <h3 className="text-xl font-bold mb-4">
                  Send the link to your client
                </h3>
                <p className="text-muted mb-6 leading-relaxed">
                  They open it and see: milestones, progress, amounts, payment methods. Updated live, no signup required on their end.
                </p>
                <p className="text-sm text-muted/60 font-mono">
                  codefor.food/p/acme-redesign
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <p className="mono-tag mb-4">Step 3</p>
                <h3 className="text-xl font-bold mb-4">
                  Mark payments as they come in
                </h3>
                <p className="text-muted mb-6 leading-relaxed">
                  Client pays you however they want — crypto, bank, PayPal. You mark the payment, the page updates. Partial payments work too.
                </p>
              </div>
              <div className="order-1 lg:order-2">
                <div className="screenshot-frame bg-card">
                  <div className="aspect-[4/3] bg-background/50">
                    <img src="/how3.png" alt="Payment tracking" className="w-full h-full object-cover object-top" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Billing models */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                Three billing models, one project
              </h2>
              <p className="text-muted">
                Use all three in the same project. Bill however makes sense for each task.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 rounded-xl overflow-hidden">
              <div className="bg-card p-6 hover:bg-card-hover transition-colors">
                <h3 className="font-bold mb-1">Fixed Price</h3>
                <p className="text-sm text-muted mb-4">&quot;Homepage — $1,500&quot;</p>
                <div className="bg-background/50 rounded-lg p-3 text-sm font-mono space-y-1">
                  <div className="flex justify-between"><span className="text-muted">Price</span><span>$1,500</span></div>
                  <div className="flex justify-between"><span className="text-muted">Paid</span><span className="text-success">$1,000</span></div>
                </div>
              </div>
              <div className="bg-card p-6 hover:bg-card-hover transition-colors">
                <h3 className="font-bold mb-1">Hourly</h3>
                <p className="text-sm text-muted mb-4">&quot;Bug fixes — $75/hr&quot;</p>
                <div className="bg-background/50 rounded-lg p-3 text-sm font-mono space-y-1">
                  <div className="flex justify-between"><span className="text-muted">Logged</span><span>12.5 hrs</span></div>
                  <div className="flex justify-between"><span className="text-muted">Total</span><span>$937.50</span></div>
                </div>
              </div>
              <div className="bg-card p-6 hover:bg-card-hover transition-colors">
                <h3 className="font-bold mb-1">Per Unit</h3>
                <p className="text-sm text-muted mb-4">&quot;Blog posts — $50 each&quot;</p>
                <div className="bg-background/50 rounded-lg p-3 text-sm font-mono space-y-1">
                  <div className="flex justify-between"><span className="text-muted">Units</span><span>8 posts</span></div>
                  <div className="flex justify-between"><span className="text-muted">Total</span><span>$400</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What client sees */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  What your client sees
                </h2>
                <p className="text-muted mb-8 leading-relaxed">
                  A clean page with everything they need. No account, no app — just a link.
                </p>

                <div className="space-y-4 text-sm">
                  {[
                    ["Progress", "What's done, what's in progress, what's next"],
                    ["Money", "Total, paid, remaining — at a glance"],
                    ["Payment methods", "Your wallets and bank details with one-click copy"],
                    ["Time logs", "For hourly milestones — date, hours, description"],
                    ["Payment history", "Every payment with date and amount"],
                  ].map(([title, desc], i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-accent font-mono text-xs mt-1 shrink-0">{'>'}</span>
                      <div>
                        <span className="text-foreground font-medium">{title}</span>
                        <span className="text-muted"> — {desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="screenshot-frame bg-card">
                <div className="aspect-[4/3] bg-background/50">
                  <img src="/clientsees.png" alt="Client view" className="w-full h-full object-cover object-top" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy controls */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <div className="screenshot-frame bg-card">
                  <div className="aspect-[4/3] bg-background/50">
                    <img src="/control.png" alt="Privacy settings" className="w-full h-full object-cover object-top" />
                  </div>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  You decide what&apos;s visible
                </h2>
                <p className="text-muted mb-8 leading-relaxed">
                  Not every client needs to see every number. Toggle per project.
                </p>
                <div className="space-y-3 text-sm">
                  {[
                    ["Hide amounts", "Show progress without dollar figures"],
                    ["Hide payment info", "Keep paid/unpaid status private"],
                    ["Password protect", "Require a password to view"],
                    ["Hide expenses", "Keep your project costs to yourself"],
                  ].map(([title, desc], i) => (
                    <div key={i} className="flex items-start gap-3 py-2">
                      <span className="text-accent mt-0.5">—</span>
                      <div>
                        <span className="text-foreground font-medium">{title}</span>
                        <span className="text-muted"> — {desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Encrypted notes */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-4">
                    Encrypted notes
                  </h2>
                  <p className="text-muted mb-6 leading-relaxed">
                    AES-256. The password never leaves your device. We can&apos;t read your notes even if we want to.
                  </p>
                  <div className="text-sm text-muted space-y-1">
                    <p>Good for client API keys, cost breakdowns,</p>
                    <p>negotiation notes, anything private.</p>
                  </div>
                </div>
                <div className="bg-background rounded-lg p-5 font-mono text-sm border border-border/50">
                  <div className="flex items-center gap-2 mb-4 text-xs text-muted/50">
                    <span>🔒</span>
                    <span>ENCRYPTED NOTE</span>
                  </div>
                  <p className="text-muted mb-1">Client&apos;s AWS credentials:</p>
                  <p className="text-muted/30 mb-3">••••••••••••••••</p>
                  <p className="text-muted mb-1">Real cost breakdown:</p>
                  <p className="text-muted/30">••••••••••••••••</p>
                  <div className="mt-5 pt-3 border-t border-border/30 text-xs text-muted/30">
                    AES-256 · client-side only
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                All projects, one dashboard
              </h2>
              <p className="text-muted">
                Total earned, outstanding, hours logged — across everything.
              </p>
            </div>

            <div className="screenshot-frame bg-card">
              <div className="aspect-video bg-background/50">
                <img src="/commandcenter.png" alt="Dashboard" className="w-full h-full object-cover object-top" />
              </div>
            </div>
          </div>
        </section>

        {/* Expenses */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  Track what you spend
                </h2>
                <p className="text-muted mb-6 leading-relaxed">
                  Hosting, domains, APIs, stock photos — log them to see real profit.
                </p>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="space-y-2.5 text-sm font-mono">
                    <div className="flex justify-between"><span className="text-muted">Vercel Pro</span><span>$20/mo</span></div>
                    <div className="flex justify-between"><span className="text-muted">Domain</span><span>$15</span></div>
                    <div className="flex justify-between"><span className="text-muted">Stock images</span><span>$45</span></div>
                    <div className="flex justify-between pt-2.5 border-t border-border font-medium">
                      <span>Total</span>
                      <span>$80</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="screenshot-frame bg-card">
                <div className="aspect-[4/3] bg-background/50">
                  <img src="/expenses.png" alt="Expenses" className="w-full h-full object-cover object-top" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Attachments + Comments */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-12">
              Attachments &amp; comments
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/50 rounded-xl overflow-hidden">
              <div className="bg-card p-6 hover:bg-card-hover transition-colors">
                <h3 className="font-bold mb-1">Links to everything</h3>
                <p className="text-sm text-muted mb-4">Figma, GitHub, staging — visible to client.</p>
                <div className="space-y-1.5 text-sm font-mono text-muted/60">
                  <p>figma.com/acme-redesign</p>
                  <p>github.com/acme/frontend</p>
                  <p>staging.acme.com</p>
                </div>
              </div>
              <div className="bg-card p-6 hover:bg-card-hover transition-colors">
                <h3 className="font-bold mb-1">Project timeline</h3>
                <p className="text-sm text-muted mb-4">Post updates your client can see.</p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted/40 font-mono text-xs">Jan 15</span> <span className="text-muted ml-2">Design approved</span></p>
                  <p><span className="text-muted/40 font-mono text-xs">Jan 18</span> <span className="text-muted ml-2">Header + footer done</span></p>
                  <p><span className="text-muted/40 font-mono text-xs">Jan 22</span> <span className="text-muted ml-2">Deployed to staging</span></p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* API */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-4">REST API</h2>
                  <p className="text-muted mb-6 leading-relaxed">
                    Create projects, log time, record payments — programmatically.
                    Wire it into your invoicing tool or a script.
                  </p>
                  <div className="text-sm text-muted/60 space-y-1">
                    <p>→ Projects, milestones, time entries</p>
                    <p>→ Payments and expenses</p>
                    <p>→ Idempotent, safe to retry</p>
                  </div>
                </div>
                <div className="bg-background rounded-lg p-5 font-mono text-sm overflow-x-auto border border-border/50">
                  <p className="text-muted/40"># log time</p>
                  <p><span className="text-accent">POST</span> <span className="text-muted">/api/v1/time-entries</span></p>
                  <pre className="text-muted mt-3">{`{
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

        {/* Pricing */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Pricing
            </h2>
            <p className="text-muted mb-12">
              7-day trial, no card. Cancel anytime.
            </p>

            <div className="grid md:grid-cols-2 gap-px bg-border/50 rounded-xl overflow-hidden max-w-2xl mx-auto">
              <div className="bg-card p-8 flex flex-col hover:bg-card-hover transition-colors">
                <p className="mono-tag mb-4">Pro</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold price-tag">$4.99</span>
                  <span className="text-muted text-sm">/mo</span>
                </div>
                <div className="space-y-2 text-sm text-muted mb-8 flex-1">
                  <p>3 organizations</p>
                  <p>5 projects per org</p>
                  <p>Telegram bot</p>
                  <p>All features</p>
                </div>
                <a
                  href={`${adminUrl}/login`}
                  className="block w-full py-3 text-center border border-border rounded-lg hover:border-accent/50 transition-colors text-sm"
                >
                  Start trial
                </a>
              </div>
              <div className="bg-card p-8 flex flex-col relative hover:bg-card-hover transition-colors">
                <div className="absolute top-4 right-4">
                  <span className="text-xs font-mono text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/20">popular</span>
                </div>
                <p className="mono-tag mb-4">Unlimited</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-bold price-tag gradient-text">$9.99</span>
                  <span className="text-muted text-sm">/mo</span>
                </div>
                <div className="space-y-2 text-sm text-muted mb-8 flex-1">
                  <p>Unlimited orgs &amp; projects</p>
                  <p>Telegram bot</p>
                  <p>Full API access</p>
                  <p>Everything in Pro</p>
                </div>
                <a
                  href={`${adminUrl}/login`}
                  className="block w-full py-3 text-center bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover transition-colors text-sm"
                >
                  Start trial
                </a>
              </div>
            </div>

            <p className="text-sm text-muted/40 mt-6 text-center max-w-2xl mx-auto">
              30-day money-back guarantee.{" "}
              <Link href="/pricing" className="hover:text-muted transition-colors underline underline-offset-4">
                Compare plans
              </Link>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-12">
              Questions
            </h2>

            <div className="divide-y divide-border/30">
              {[
                {
                  q: "Do payments go through you?",
                  a: "No. Clients pay you directly — bank, crypto, PayPal, whatever. We track what's been paid, that's it."
                },
                {
                  q: "Does my client need an account?",
                  a: "No. They open a link and see the project page. No signup, nothing to install."
                },
                {
                  q: "Can I hide amounts?",
                  a: "Yes. Show progress without numbers, hide payment status, password-protect the page — your choice per project."
                },
                {
                  q: "How do encrypted notes work?",
                  a: "Encryption happens in your browser. The password stays on your device. We literally cannot read your notes."
                },
                {
                  q: "What's fixed vs hourly vs per-unit?",
                  a: "Fixed: $500 for logo. Hourly: $75/hr × hours logged. Per-unit: $50/post × 8 posts. Mix all three in one project."
                },
                {
                  q: "Can I cancel?",
                  a: "Anytime, one click. You keep access until the period ends."
                }
              ].map((item, i) => (
                <div key={i} className="py-6 first:pt-0 last:pb-0">
                  <h3 className="font-semibold mb-2">{item.q}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-24 border-t border-border/50">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Stop explaining your own invoices
            </h2>
            <p className="text-muted mb-8 text-lg">
              One link instead of a spreadsheet, a chat thread, and a notes app.
            </p>
            <a
              href={`${adminUrl}/login`}
              className="inline-block px-8 py-4 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover text-lg transition-all hover:shadow-[0_0_30px_rgba(250,204,21,0.3)]"
            >
              Try free for 7 days
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-12 px-4 mt-auto">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-accent font-bold font-mono text-sm">{"<codeforfood/>"}</div>
            <div className="flex items-center gap-6 text-xs text-muted/50">
              <Link href="/pricing" className="hover:text-muted transition-colors">Pricing</Link>
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
  );
}
