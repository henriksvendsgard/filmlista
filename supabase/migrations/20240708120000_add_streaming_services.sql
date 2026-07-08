-- Add streaming service preferences to user profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS streaming_services INTEGER[] DEFAULT '{}' NOT NULL;
