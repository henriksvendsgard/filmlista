-- This is an example migration file for Filmlista
-- When setting up your local development environment, this will be applied to create the initial schema

-- Enable RLS (Row Level Security)
ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'your-super-secret-jwt-secret';

-- Create profiles table that extends the auth.users table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create watchlists table
CREATE TABLE IF NOT EXISTS public.watchlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create movies table (to store TMDB movie data)
CREATE TABLE IF NOT EXISTS public.movies (
  tmdb_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  poster_path TEXT,
  backdrop_path TEXT,
  overview TEXT,
  release_date DATE,
  data JSONB, -- Store additional movie data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create watchlist_movies junction table
CREATE TABLE IF NOT EXISTS public.watchlist_movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
  tmdb_id INTEGER REFERENCES public.movies(tmdb_id) ON DELETE CASCADE NOT NULL,
  added_by UUID REFERENCES public.profiles(id),
  watched BOOLEAN DEFAULT false,
  watched_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(watchlist_id, tmdb_id)
);

-- Create watchlist_shares table for shared watchlists
CREATE TABLE IF NOT EXISTS public.watchlist_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watchlist_id UUID REFERENCES public.watchlists(id) ON DELETE CASCADE NOT NULL,
  shared_with UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(watchlist_id, shared_with)
);

-- Set up Row Level Security (RLS) policies

-- Profiles table policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Watchlists table policies
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Watchlists are viewable by owner and shared users"
  ON public.watchlists FOR SELECT
  USING (
    owner_id = auth.uid() OR 
    is_public = true OR
    EXISTS (
      SELECT 1 FROM public.watchlist_shares
      WHERE watchlist_id = id AND shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own watchlists"
  ON public.watchlists FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own watchlists"
  ON public.watchlists FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own watchlists"
  ON public.watchlists FOR DELETE
  USING (owner_id = auth.uid());

-- Movies table policies (public read, authenticated insert)
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Movies are viewable by everyone"
  ON public.movies FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert movies"
  ON public.movies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update movies"
  ON public.movies FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Watchlist_movies table policies
ALTER TABLE public.watchlist_movies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Watchlist movies are viewable by watchlist viewers"
  ON public.watchlist_movies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE id = watchlist_id AND (
        owner_id = auth.uid() OR
        is_public = true OR
        EXISTS (
          SELECT 1 FROM public.watchlist_shares
          WHERE watchlist_id = watchlists.id AND shared_with = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert movies to their watchlists"
  ON public.watchlist_movies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE id = watchlist_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.watchlist_shares
          WHERE watchlist_id = watchlists.id AND shared_with = auth.uid() AND can_edit = true
        )
      )
    )
  );

CREATE POLICY "Users can update movies in their watchlists"
  ON public.watchlist_movies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE id = watchlist_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.watchlist_shares
          WHERE watchlist_id = watchlists.id AND shared_with = auth.uid() AND can_edit = true
        )
      )
    )
  );

CREATE POLICY "Users can delete movies from their watchlists"
  ON public.watchlist_movies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE id = watchlist_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.watchlist_shares
          WHERE watchlist_id = watchlists.id AND shared_with = auth.uid() AND can_edit = true
        )
      )
    )
  );

-- Watchlist_shares table policies
ALTER TABLE public.watchlist_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Watchlist shares are viewable by watchlist owner and shared users"
  ON public.watchlist_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE id = watchlist_id AND owner_id = auth.uid()
    ) OR
    shared_with = auth.uid()
  );

CREATE POLICY "Watchlist owners can insert shares"
  ON public.watchlist_shares FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE id = watchlist_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Watchlist owners can update shares"
  ON public.watchlist_shares FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE id = watchlist_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Watchlist owners can delete shares"
  ON public.watchlist_shares FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.watchlists
      WHERE id = watchlist_id AND owner_id = auth.uid()
    )
  );

-- Create functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.watchlists
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.movies
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.watchlist_movies
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.watchlist_shares
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- Create a function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (NEW.id, NEW.email, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger the function every time a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user(); 