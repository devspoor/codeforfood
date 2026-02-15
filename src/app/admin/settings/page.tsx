import { getCurrentProfile, getCurrentUser } from "@/lib/db";
import { getSubscription } from "@/lib/paddle/subscriptions";
import { TelegramConnect } from "@/components/TelegramConnect";
import Image from "next/image";
import Link from "next/link";

export default async function SettingsPage() {
  const [profile, user] = await Promise.all([
    getCurrentProfile(),
    getCurrentUser(),
  ]);

  const subscription = user ? await getSubscription(user.id) : null;
  const isActive = subscription?.status === 'trialing' || subscription?.status === 'active';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your account and integrations</p>
      </div>

      {/* Profile Section */}
      <section className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          {profile?.avatar_url && (
            <Image
              src={profile.avatar_url}
              alt=""
              width={64}
              height={64}
              className="size-16 rounded-full border border-border"
            />
          )}
          <div>
            <p className="font-medium text-foreground">{profile?.name || "—"}</p>
            <p className="text-sm text-muted">{profile?.email}</p>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Subscription</h2>
          <Link
            href="/admin/settings/billing"
            className="text-sm text-accent hover:underline"
          >
            {isActive ? 'Manage' : 'Upgrade'}
          </Link>
        </div>

        {isActive ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-success/10 text-success text-xs font-medium rounded">
                {subscription?.status === 'trialing' ? 'Trial' : 'Active'}
              </span>
              <span className="font-medium capitalize">{subscription?.plan}</span>
            </div>

            {subscription?.status === 'trialing' && subscription.trial_ends_at && (
              <p className="text-sm text-muted">
                Trial ends {new Date(subscription.trial_ends_at).toLocaleDateString('en')}
              </p>
            )}

            {subscription?.status === 'active' && subscription.current_period_ends_at && (
              <p className="text-sm text-muted">
                Next billing {new Date(subscription.current_period_ends_at).toLocaleDateString('en')}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-warning/10 text-warning text-xs font-medium rounded">
                {subscription?.status === 'canceled' ? 'Canceled' :
                 subscription?.status === 'past_due' ? 'Past Due' : 'Free'}
              </span>
            </div>
            <p className="text-sm text-muted">
              Upgrade to unlock all features
            </p>
          </div>
        )}
      </section>

      {/* Integrations Section */}
      <section className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Integrations</h2>
        <TelegramConnect />
      </section>
    </div>
  );
}
