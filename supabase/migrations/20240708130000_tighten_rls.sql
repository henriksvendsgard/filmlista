-- Tighten Row Level Security policies

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.lists;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.shared_lists;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.media_items;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.watched_media;

-- Helper: user can access a list if they own it or it is shared with them
CREATE OR REPLACE FUNCTION public.user_can_access_list(list_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.lists
    WHERE id = list_uuid AND owner_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.shared_lists
    WHERE list_id = list_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- lists
CREATE POLICY "Users can view own or shared lists" ON public.lists
  FOR SELECT USING (public.user_can_access_list(id));

CREATE POLICY "Users can create own lists" ON public.lists
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own lists" ON public.lists
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own lists" ON public.lists
  FOR DELETE USING (owner_id = auth.uid());

-- shared_lists
CREATE POLICY "Users can view relevant shares" ON public.shared_lists
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.lists WHERE id = list_id AND owner_id = auth.uid())
  );

CREATE POLICY "List owners can share lists" ON public.shared_lists
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.lists WHERE id = list_id AND owner_id = auth.uid())
  );

CREATE POLICY "List owners can remove shares" ON public.shared_lists
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.lists WHERE id = list_id AND owner_id = auth.uid())
  );

-- media_items
CREATE POLICY "Users can view media in accessible lists" ON public.media_items
  FOR SELECT USING (public.user_can_access_list(list_id));

CREATE POLICY "Users can add media to accessible lists" ON public.media_items
  FOR INSERT WITH CHECK (public.user_can_access_list(list_id));

CREATE POLICY "Users can update media in accessible lists" ON public.media_items
  FOR UPDATE USING (public.user_can_access_list(list_id));

CREATE POLICY "Users can remove media from accessible lists" ON public.media_items
  FOR DELETE USING (public.user_can_access_list(list_id));

-- watched_media
CREATE POLICY "Users can view watched state in accessible lists" ON public.watched_media
  FOR SELECT USING (public.user_can_access_list(list_id));

CREATE POLICY "Users can mark watched in accessible lists" ON public.watched_media
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND public.user_can_access_list(list_id)
  );

CREATE POLICY "Users can unmark own watched state" ON public.watched_media
  FOR DELETE USING (
    user_id = auth.uid() AND public.user_can_access_list(list_id)
  );

-- profiles: restrict read to authenticated users
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
CREATE POLICY "Authenticated users can read profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
