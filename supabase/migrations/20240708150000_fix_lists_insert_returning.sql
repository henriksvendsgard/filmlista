-- Fix INSERT ... RETURNING on lists.
-- The previous SELECT policy called user_can_access_list(), which queries lists
-- and fails during RETURNING on the row being inserted.

CREATE OR REPLACE FUNCTION public.user_is_shared_list_member(list_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shared_lists
    WHERE list_id = list_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Users can view own or shared lists" ON public.lists;

CREATE POLICY "Users can view own or shared lists" ON public.lists
  FOR SELECT USING (
    owner_id = auth.uid()
    OR public.user_is_shared_list_member(id)
  );

-- Keep media_items policies consistent; remove STABLE so lookups stay fresh.
CREATE OR REPLACE FUNCTION public.user_can_access_list(list_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.lists
    WHERE id = list_uuid AND owner_id = auth.uid()
  ) OR public.user_is_shared_list_member(list_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
