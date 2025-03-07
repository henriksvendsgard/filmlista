-- This is an example seed file for Filmlista
-- It will populate your local database with test data for development

-- Insert some example movies
INSERT INTO public.movies (tmdb_id, title, poster_path, backdrop_path, overview, release_date, data)
VALUES
  (550, 'Fight Club', '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', '/hZkgoQYus5vegHoetLkCJzb17zJ.jpg', 'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.', '1999-10-15', '{"genres":[{"id":18,"name":"Drama"}],"runtime":139,"vote_average":8.4}'),
  (680, 'Pulp Fiction', '/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg', '/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg', 'A burger-loving hit man, his philosophical partner, a drug-addled gangster''s moll and a washed-up boxer converge in this sprawling, comedic crime caper.', '1994-09-10', '{"genres":[{"id":53,"name":"Thriller"},{"id":80,"name":"Crime"}],"runtime":154,"vote_average":8.5}'),
  (13, 'Forrest Gump', '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', '/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg', 'A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do.', '1994-06-23', '{"genres":[{"id":35,"name":"Comedy"},{"id":18,"name":"Drama"},{"id":10749,"name":"Romance"}],"runtime":142,"vote_average":8.5}')
ON CONFLICT (tmdb_id) DO NOTHING;

-- Insert a test user (only works in local development)
-- In production, users are created through the auth system
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'test@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456789', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert a profile for the test user
INSERT INTO public.profiles (id, displayname, avatar_url, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'testuser', '', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert some watchlists for the test user
INSERT INTO public.watchlists (id, name, description, is_public, owner_id, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'My Favorites', 'A collection of my all-time favorite movies', true, '00000000-0000-0000-0000-000000000000', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'Watch Later', 'Movies I want to watch someday', false, '00000000-0000-0000-0000-000000000000', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Add movies to watchlists
INSERT INTO public.watchlist_movies (watchlist_id, tmdb_id, added_by, watched, watched_at, notes, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 550, '00000000-0000-0000-0000-000000000000', true, now() - interval '10 days', 'Incredible movie, need to watch again', now(), now()),
  ('11111111-1111-1111-1111-111111111111', 680, '00000000-0000-0000-0000-000000000000', true, now() - interval '30 days', 'Classic Tarantino', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 13, '00000000-0000-0000-0000-000000000000', false, null, 'Heard this is good', now(), now())
ON CONFLICT (watchlist_id, tmdb_id) DO NOTHING;

-- Insert another test user for sharing
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'friend@example.com', '$2a$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456789', now(), now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert a profile for the second test user
INSERT INTO public.profiles (id, displayname, avatar_url, created_at, updated_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'frienduser', '', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Share a watchlist with the second user
INSERT INTO public.watchlist_shares (watchlist_id, shared_with, can_edit, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true, now(), now())
ON CONFLICT (watchlist_id, shared_with) DO NOTHING; 