-- Sharing has always been presented as "view and edit", but shares were inserted
-- without can_edit and silently became read-only.
ALTER TABLE public.shared_lists
ALTER COLUMN can_edit SET DEFAULT true;

UPDATE public.shared_lists
SET can_edit = true
WHERE can_edit = false;
