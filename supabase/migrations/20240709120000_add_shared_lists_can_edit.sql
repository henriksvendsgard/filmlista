-- Production was created before shared_lists.can_edit existed in initial_schema.
-- CREATE TABLE IF NOT EXISTS does not add columns to an existing table.
ALTER TABLE public.shared_lists
ADD COLUMN IF NOT EXISTS can_edit BOOLEAN DEFAULT false NOT NULL;
