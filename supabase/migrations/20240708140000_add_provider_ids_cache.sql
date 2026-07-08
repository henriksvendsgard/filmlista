-- Cache TMDB streaming provider IDs on media items for faster filtering
ALTER TABLE public.media_items
ADD COLUMN IF NOT EXISTS provider_ids INTEGER[] DEFAULT '{}' NOT NULL;
