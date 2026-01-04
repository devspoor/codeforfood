-- Migration: Add paid_amount field to time_entries
-- Allows tracking payment for individual time entries

ALTER TABLE public.time_entries
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0;
