-- Allow public visitors to edit tasks on the public page
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tasks_board_editable BOOLEAN NOT NULL DEFAULT false;
