import { SupabaseClient } from "@supabase/supabase-js";
import { fetchWatchProviders, getProviderIds } from "@/lib/watchProviders";

export interface List {
    id: string;
    name: string;
    owner_id: string;
    created_at?: string;
}

export interface ListsResult {
    owned: List[];
    shared: List[];
}

export interface AddToListParams {
    mediaId: string;
    listId: string;
    mediaType: "movie" | "tv";
    title: string;
    posterPath: string | null;
    addedBy: string;
    releaseDate?: string | null;
}

export interface WatchedEntry {
    userId: string;
    displayname: string;
    watchedAt: string;
}

export interface MediaEntry {
    mediaId: string;
    title: string;
    posterPath: string;
    addedAt: string;
    addedBy: string;
    addedByDisplayname: string;
    releaseDate: string;
    mediaType: "movie" | "tv";
    providerIds: number[];
    watchedBy: WatchedEntry[];
    isWatchedByMe: boolean;
}

export async function getLists(supabase: SupabaseClient, userId: string): Promise<ListsResult> {
    const [ownedResult, sharedResult] = await Promise.all([
        supabase.from("lists").select("*").eq("owner_id", userId).order("created_at", { ascending: false }),
        supabase
            .from("shared_lists")
            .select("lists(*)")
            .eq("user_id", userId),
    ]);

    if (ownedResult.error) throw ownedResult.error;
    if (sharedResult.error) throw sharedResult.error;

    const shared = (sharedResult.data ?? [])
        .map((row: { lists: List | List[] | null }) => (Array.isArray(row.lists) ? row.lists[0] : row.lists))
        .filter((list): list is List => list !== null);

    return {
        owned: ownedResult.data ?? [],
        shared,
    };
}

export async function getListsForMedia(
    supabase: SupabaseClient,
    mediaId: string,
    mediaType: "movie" | "tv"
): Promise<string[]> {
    const { data, error } = await supabase
        .from("media_items")
        .select("list_id")
        .eq("movie_id", mediaId)
        .eq("media_type", mediaType);

    if (error) throw error;
    return (data ?? []).map((item: { list_id: string }) => item.list_id);
}

export async function getListsForMediaBatch(
    supabase: SupabaseClient,
    mediaIds: string[],
    mediaType: "movie" | "tv"
): Promise<Record<string, string[]>> {
    if (mediaIds.length === 0) return {};

    const { data, error } = await supabase
        .from("media_items")
        .select("movie_id, list_id")
        .eq("media_type", mediaType)
        .in("movie_id", mediaIds);

    if (error) throw error;

    const result: Record<string, string[]> = {};
    for (const item of data ?? []) {
        const id: string = item.movie_id;
        if (!result[id]) result[id] = [];
        result[id].push(item.list_id);
    }
    return result;
}

export async function getMediaForList(
    supabase: SupabaseClient,
    listId: string,
    currentUserId: string
): Promise<MediaEntry[]> {
    const { data: rawItems, error: itemsError } = await supabase
        .from("media_items")
        .select(
            `
            movie_id,
            title,
            poster_path,
            added_at,
            added_by,
            release_date,
            media_type,
            provider_ids,
            profiles (displayname, email)
        `
        )
        .eq("list_id", listId)
        .order("added_at", { ascending: false });

    if (itemsError) throw itemsError;

    const { data: watchedData, error: watchedError } = await supabase
        .from("watched_media")
        .select("user_id, movie_id, watched_at, media_type")
        .eq("list_id", listId);

    if (watchedError) throw watchedError;

    const userIds = Array.from(new Set((watchedData ?? []).map((w: { user_id: string }) => w.user_id)));
    const profileMap = new Map<string, string>();
    if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, displayname")
            .in("id", userIds);
        if (profilesError) throw profilesError;
        for (const p of profilesData ?? []) {
            profileMap.set(p.id, p.displayname);
        }
    }

    return (rawItems ?? []).map((item: {
        movie_id: string;
        title: string;
        poster_path: string | null;
        added_at: string;
        added_by: string | null;
        release_date: string | null;
        media_type: string;
        provider_ids: number[] | null;
        profiles:
            | { displayname: string | null; email: string | null }
            | { displayname: string | null; email: string | null }[]
            | null;
    }) => {
        const movieId: string = item.movie_id;
        const mediaType: string = item.media_type;
        const profiles = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
        const watchedByUsers = (watchedData ?? [])
            .filter((w: { movie_id: string; media_type: string }) => w.movie_id === movieId && w.media_type === mediaType)
            .map((w: { user_id: string; watched_at: string }) => ({
                userId: w.user_id,
                displayname: profileMap.get(w.user_id) ?? "Unknown",
                watchedAt: w.watched_at,
            }));

        return {
            mediaId: movieId,
            title: item.title as string,
            posterPath: (item.poster_path as string) ?? "",
            addedAt: item.added_at as string,
            addedBy: item.added_by as string,
            addedByDisplayname: profiles?.displayname ?? profiles?.email ?? "Unknown",
            releaseDate: (item.release_date as string) ?? "",
            mediaType: mediaType as "movie" | "tv",
            providerIds: (item.provider_ids as number[]) ?? [],
            watchedBy: watchedByUsers,
            isWatchedByMe: watchedByUsers.some((w: WatchedEntry) => w.userId === currentUserId),
        };
    });
}

export async function addToList(supabase: SupabaseClient, params: AddToListParams): Promise<void> {
    const { mediaId, listId, mediaType, title, posterPath, addedBy, releaseDate } = params;

    const { error: watchedError } = await supabase
        .from("watched_media")
        .delete()
        .eq("list_id", listId)
        .eq("movie_id", mediaId)
        .eq("media_type", mediaType);

    if (watchedError) throw watchedError;

    const providers = await fetchWatchProviders(mediaId, mediaType);
    const providerIds = getProviderIds(providers);

    const { error } = await supabase.from("media_items").insert({
        list_id: listId,
        movie_id: mediaId,
        title,
        poster_path: posterPath,
        added_by: addedBy,
        media_type: mediaType,
        release_date: releaseDate,
        provider_ids: providerIds,
    });

    if (error) throw error;
}

export async function removeFromList(
    supabase: SupabaseClient,
    params: {
        mediaId: string;
        listId: string;
        mediaType: "movie" | "tv";
        alsoRemoveWatched?: boolean;
    }
): Promise<void> {
    const { mediaId, listId, mediaType, alsoRemoveWatched = false } = params;

    const { error } = await supabase
        .from("media_items")
        .delete()
        .eq("movie_id", mediaId)
        .eq("list_id", listId)
        .eq("media_type", mediaType);

    if (error) throw error;

    if (alsoRemoveWatched) {
        const { error: watchedError } = await supabase
            .from("watched_media")
            .delete()
            .eq("list_id", listId)
            .eq("movie_id", mediaId)
            .eq("media_type", mediaType);

        if (watchedError) throw watchedError;
    }
}

export async function toggleWatched(
    supabase: SupabaseClient,
    params: {
        mediaId: string;
        listId: string;
        userId: string;
        mediaType: "movie" | "tv";
        isWatched: boolean;
    }
): Promise<void> {
    const { mediaId, listId, userId, mediaType, isWatched } = params;

    if (isWatched) {
        const { error } = await supabase
            .from("watched_media")
            .delete()
            .eq("movie_id", mediaId)
            .eq("list_id", listId)
            .eq("user_id", userId)
            .eq("media_type", mediaType);
        if (error) throw error;
    } else {
        const { error } = await supabase.from("watched_media").insert({
            movie_id: mediaId,
            list_id: listId,
            user_id: userId,
            media_type: mediaType,
        });
        if (error) throw error;
    }
}

export async function createList(
    supabase: SupabaseClient,
    params: { name: string; ownerId: string }
): Promise<List> {
    const { data, error } = await supabase
        .from("lists")
        .insert([{ name: params.name, owner_id: params.ownerId }])
        .select()
        .single();

    if (error) throw error;
    return data as List;
}

export async function updateList(supabase: SupabaseClient, id: string, name: string): Promise<void> {
    const { error } = await supabase.from("lists").update({ name }).eq("id", id);
    if (error) throw error;
}

export async function deleteList(supabase: SupabaseClient, id: string): Promise<void> {
    const { error: mediaError } = await supabase.from("media_items").delete().eq("list_id", id);
    if (mediaError) throw mediaError;

    const { error: sharedError } = await supabase.from("shared_lists").delete().eq("list_id", id);
    if (sharedError) throw sharedError;

    const { error } = await supabase.from("lists").delete().eq("id", id);
    if (error) throw error;
}

export async function shareList(
    supabase: SupabaseClient,
    params: { listId: string; email: string }
): Promise<void> {
    const { listId, email } = params;

    const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

    if (userError || !userData) throw new Error("USER_NOT_FOUND");

    const { data: existingShare } = await supabase
        .from("shared_lists")
        .select("list_id")
        .eq("list_id", listId)
        .eq("user_id", userData.id)
        .single();

    if (existingShare) throw new Error("ALREADY_SHARED");

    const { error } = await supabase
        .from("shared_lists")
        .insert([{ list_id: listId, user_id: userData.id }]);

    if (error) throw error;
}
