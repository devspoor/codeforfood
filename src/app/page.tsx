export default function Home() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "https://my.codefor.food";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="w-full py-6 px-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="text-accent font-bold text-lg">{"<cff/>"}</div>
            <a
              href={`${adminUrl}/login`}
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Sign In
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="max-w-3xl w-full text-center">
            {/* Terminal window */}
            <div className="mb-12">
              <div className="inline-block bg-card border border-border rounded-lg overflow-hidden shadow-2xl shadow-black/50">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-card border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-danger/80" />
                  <div className="w-3 h-3 rounded-full bg-accent/80" />
                  <div className="w-3 h-3 rounded-full bg-success/80" />
                  <span className="ml-3 text-xs text-muted">billing.sh</span>
                </div>
                {/* Terminal content */}
                <div className="px-6 py-5 text-left">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-success">$</span>
                    <span className="text-muted">npx</span>
                    <span className="text-accent font-semibold">codeforfood</span>
                    <span className="text-muted">--track</span>
                  </div>
                  <div className="mt-3 text-xs text-muted/70">
                    <p>Initializing billing tracker...</p>
                    <p className="text-success mt-1">Ready. 3 projects, $12,450 tracked.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Logo */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">{"<codeforfood/>"}</span>
            </h1>

            {/* Tagline */}
            <p className="text-lg sm:text-xl text-muted mb-3">
              Project billing tracker for freelancers
            </p>
            <p className="text-sm text-muted/60 mb-10 max-w-md mx-auto">
              Track milestones, share progress with clients, and get paid faster.
              Built for developers who code for food.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`${adminUrl}/login`}
                className="btn-glow px-8 py-3.5 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover"
              >
                Get Started
              </a>
              <a
                href="#features"
                className="px-8 py-3.5 border border-border text-muted rounded-lg hover:border-muted hover:text-foreground"
              >
                Learn More
              </a>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section id="features" className="px-4 py-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center text-2xl font-bold mb-4">How it works</h2>
            <p className="text-center text-muted text-sm mb-16 max-w-lg mx-auto">
              Simple workflow to manage your freelance billing
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="card-glow bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Create Milestones</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Break down your projects into trackable payment milestones. Fixed price or hourly, your choice.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="card-glow bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Share with Clients</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Generate secure public links for clients to track project progress and payment status in real-time.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="card-glow bg-card border border-border rounded-xl p-6">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg mb-2">Get Paid Faster</h3>
                <p className="text-muted text-sm leading-relaxed">
                  Display your payment methods right on the project page. Crypto, bank transfer, or any method you prefer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="px-4 py-16 border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold gradient-text">$3.99</p>
                <p className="text-sm text-muted mt-1">per month</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">E2E</p>
                <p className="text-sm text-muted mt-1">Encrypted notes</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">Realtime</p>
                <p className="text-sm text-muted mt-1">Progress tracking</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">Open</p>
                <p className="text-sm text-muted mt-1">API & Links</p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="px-4 py-20 border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-center text-2xl font-bold mb-4">Perfect for</h2>
            <p className="text-center text-muted text-sm mb-12">
              Developers, designers, and freelancers
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: "Web Dev", desc: "Track website builds" },
                { icon: "Mobile", desc: "App development projects" },
                { icon: "Design", desc: "UI/UX design work" },
                { icon: "Contract", desc: "Long-term contracts" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-card/50 border border-border rounded-lg p-4 text-center hover:border-accent/30 transition-colors"
                >
                  <div className="text-accent text-lg mb-2">{`<${item.icon}/>`}</div>
                  <p className="text-sm text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 py-20">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-card border border-border rounded-2xl p-8 sm:p-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  Start tracking your projects
                </h2>
                <p className="text-muted mb-2 max-w-md mx-auto">
                  $3.99/month or $39.9/year
                </p>
                <p className="text-muted/60 text-sm mb-8 max-w-md mx-auto">
                  Cancel anytime. Start managing your freelance billing today.
                </p>
                <a
                  href={`${adminUrl}/login`}
                  className="btn-glow inline-block px-8 py-3.5 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-accent font-bold">{"<codeforfood/>"}</div>
            <p className="text-xs text-muted/50">
              {"// hack the planet"}
            </p>
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
