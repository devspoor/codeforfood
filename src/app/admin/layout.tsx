import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/LogoutButton";
import { getCurrentProfile, getCurrentUser } from "@/lib/db";
import { getSubscription } from "@/lib/paddle/subscriptions";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { PaddleProvider } from "@/components/PaddleProvider";
import type { Metadata } from "next";

// Prevent admin pages from being indexed by search engines
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  const user = await getCurrentUser();
  const subscription = user ? await getSubscription(user.id) : null;

  return (
    <PaddleProvider>
    <div className="min-h-screen relative">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/admin"
              className="flex items-center gap-2 text-lg font-bold text-accent hover:text-accent-hover"
            >
              <Image
                src="/logo.png"
                alt="codeforfood"
                width={24}
                height={24}
                className="size-6"
              />
              <span className="hidden sm:block">codeforfood</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-card"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:block">Dashboard</span>
              </Link>
              <Link
                href="/admin/organizations"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-card"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="hidden sm:block">Organizations</span>
              </Link>

              {/* Divider */}
              <div className="w-px h-6 bg-border mx-2" />

              {/* User section */}
              <div className="flex items-center gap-1">
                {profile?.avatar_url && (
                  <Image
                    src={profile.avatar_url}
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 rounded-full border border-border"
                  />
                )}
                <span className="text-sm text-muted hidden md:block max-w-[120px] truncate ml-1 mr-2">
                  {profile?.name || profile?.email}
                </span>
                <Link
                  href="/admin/settings"
                  aria-label="Settings"
                  className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-card transition-colors"
                >
                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
                <LogoutButton />
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Subscription Banner */}
      <SubscriptionBanner subscription={subscription} />

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8 animate-fade-in overflow-hidden">
        {children}
      </main>

      {/* Footer hint */}
      <footer className="fixed bottom-4 left-4 text-xs text-muted/30 hidden lg:block">
        {"// <codeforfood/>"}
      </footer>
    </div>
    </PaddleProvider>
  );
}
