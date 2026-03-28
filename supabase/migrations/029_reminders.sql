CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('before_due', 'on_due', 'overdue')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reminders_invoice_id ON reminders(invoice_id);
CREATE INDEX idx_reminders_pending ON reminders(scheduled_for) WHERE sent_at IS NULL;

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage reminders"
  ON reminders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN projects p ON p.id = i.project_id
      JOIN organizations o ON o.id = p.organization_id
      WHERE i.id = reminders.invoice_id
      AND o.user_id = auth.uid()
    )
  );
