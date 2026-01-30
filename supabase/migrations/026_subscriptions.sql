-- Migration: Create subscriptions table for Paddle billing integration
-- This table tracks user subscription status and Paddle-related data

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    paddle_customer_id TEXT,
    paddle_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'none' CHECK (status IN ('none', 'trialing', 'active', 'past_due', 'paused', 'canceled')),
    plan TEXT CHECK (plan IS NULL OR plan IN ('pro', 'unlimited')),
    trial_used BOOLEAN NOT NULL DEFAULT false,
    trial_ends_at TIMESTAMPTZ,
    current_period_ends_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_paddle_subscription_id ON public.subscriptions(paddle_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own subscription
CREATE POLICY "Users can select their own subscription"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Service role can perform all operations
CREATE POLICY "Service role has full access"
    ON public.subscriptions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Trigger function to auto-create subscription record for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.subscriptions (user_id, status)
    VALUES (NEW.id, 'none');
    RETURN NEW;
END;
$$;

-- Trigger to call the function after new user signup
CREATE TRIGGER on_auth_user_created_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_subscription();

-- Backfill: Create subscription records for existing users who don't have one
INSERT INTO public.subscriptions (user_id, status)
SELECT id, 'none'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.subscriptions);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Trigger to automatically update updated_at on row changes
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
