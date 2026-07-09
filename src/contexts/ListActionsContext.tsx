"use client";

import { toast } from "@/hooks/use-toast";
import { useSupabase } from "@/components/SupabaseProvider";
import {
    addToList as addToListRepo,
    createList,
    getLists,
    getListsForMedia,
    getListsForMediaBatch,
    List,
    removeFromList as removeFromListRepo,
    SharedList,
} from "@/lib/listRepository";
import {
    getLastUsedListId,
    membershipKey,
    setLastUsedListId,
} from "@/lib/listMembershipStorage";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";

export interface MediaRef {
    mediaId: string;
    mediaType: "movie" | "tv";
    title: string;
    posterPath: string | null;
    releaseDate?: string | null;
}

interface ListActionsContextValue {
    lists: { owned: List[]; shared: SharedList[] };
    editableShared: SharedList[];
    readOnlyShared: SharedList[];
    isLoadingLists: boolean;
    lastUsedListId: string | null;
    mediaListMap: Record<string, string[]>;
    membershipVersion: number;
    getListName: (listId: string) => string | undefined;
    getMediaListIds: (mediaId: string, mediaType: "movie" | "tv") => string[];
    ensureMediaMembership: (mediaIds: string[], mediaType: "movie" | "tv") => Promise<void>;
    ensureSingleMediaMembership: (mediaId: string, mediaType: "movie" | "tv") => Promise<string[]>;
    addToList: (media: MediaRef, listId: string) => Promise<void>;
    addToLastUsedList: (media: MediaRef) => Promise<boolean>;
    removeFromList: (media: MediaRef, listId: string, options?: { alsoRemoveWatched?: boolean }) => Promise<void>;
    toggleListMembership: (media: MediaRef, listId: string, isMember: boolean) => Promise<void>;
    createListAndAdd: (name: string, media: MediaRef) => Promise<void>;
    refreshLists: (options?: { silent?: boolean }) => Promise<void>;
    createList: (name: string) => Promise<List | null>;
    canEditList: (listId: string) => boolean;
}

const ListActionsContext = createContext<ListActionsContextValue | undefined>(undefined);

function mediaLabel(mediaType: "movie" | "tv") {
    return mediaType === "movie" ? "Filmen" : "TV-serien";
}

export function ListActionsProvider({ children }: { children: ReactNode }) {
    const { supabase, user } = useSupabase();
    const [lists, setLists] = useState<{ owned: List[]; shared: SharedList[] }>({ owned: [], shared: [] });
    const [isLoadingLists, setIsLoadingLists] = useState(true);
    const [lastUsedListId, setLastUsedListIdState] = useState<string | null>(null);
    const [mediaListMap, setMediaListMap] = useState<Record<string, string[]>>({});
    const [membershipVersion, setMembershipVersion] = useState(0);
    const listsRef = useRef(lists);
    const mediaListMapRef = useRef(mediaListMap);
    const refreshRequestIdRef = useRef(0);

    useEffect(() => {
        listsRef.current = lists;
        mediaListMapRef.current = mediaListMap;
    }, [lists, mediaListMap]);

    const setListsState = useCallback((next: { owned: List[]; shared: SharedList[] }) => {
        listsRef.current = next;
        setLists(next);
    }, []);

    const refreshLists = useCallback(
        async (options?: { silent?: boolean }) => {
            if (!user) {
                setListsState({ owned: [], shared: [] });
                setIsLoadingLists(false);
                return;
            }

            const requestId = ++refreshRequestIdRef.current;
            if (!options?.silent) {
                setIsLoadingLists(true);
            }

            try {
                const result = await getLists(supabase, user.id);
                if (requestId !== refreshRequestIdRef.current) return;
                setListsState(result);
            } catch (error) {
                if (requestId !== refreshRequestIdRef.current) return;
                console.error("Error fetching lists:", error);
                toast({
                    title: "Kunne ikke hente lister",
                    description:
                        error instanceof Error
                            ? error.message
                            : "Prøv å laste siden på nytt. Manglende database-migrasjoner kan også være årsaken.",
                    variant: "destructive",
                });
            } finally {
                if (requestId === refreshRequestIdRef.current && !options?.silent) {
                    setIsLoadingLists(false);
                }
            }
        },
        [supabase, user, setListsState]
    );

    useEffect(() => {
        setLastUsedListIdState(getLastUsedListId());
        refreshLists();
    }, [refreshLists]);

    const editableShared = useMemo(() => lists.shared.filter((list) => list.can_edit), [lists.shared]);
    const readOnlyShared = useMemo(() => lists.shared.filter((list) => !list.can_edit), [lists.shared]);

    const getListName = useCallback((listId: string) => {
        const { owned, shared } = listsRef.current;
        return [...owned, ...shared].find((list) => list.id === listId)?.name;
    }, []);

    const canEditList = useCallback((listId: string) => {
        const { owned, shared } = listsRef.current;
        if (owned.some((list) => list.id === listId)) return true;
        return shared.some((list) => list.can_edit && list.id === listId);
    }, []);

    const getMediaListIds = useCallback(
        (mediaId: string, mediaType: "movie" | "tv") => mediaListMap[membershipKey(mediaType, mediaId)] ?? [],
        [mediaListMap]
    );

    const updateMediaMap = useCallback((mediaType: "movie" | "tv", mediaId: string, listId: string, add: boolean) => {
        const key = membershipKey(mediaType, mediaId);
        setMediaListMap((prev) => {
            const current = prev[key] ?? [];
            const next = add ? [...new Set([...current, listId])] : current.filter((id) => id !== listId);
            if (next.length === 0) {
                const { [key]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [key]: next };
        });
        setMembershipVersion((v) => v + 1);
    }, []);

    const ensureMediaMembership = useCallback(
        async (mediaIds: string[], mediaType: "movie" | "tv") => {
            if (!user || mediaIds.length === 0) return;

            const missing = mediaIds.filter(
                (id) => mediaListMapRef.current[membershipKey(mediaType, id)] === undefined
            );
            if (missing.length === 0) return;

            try {
                const batch = await getListsForMediaBatch(supabase, missing, mediaType);
                setMediaListMap((prev) => {
                    const next = { ...prev };
                    for (const id of missing) {
                        const key = membershipKey(mediaType, id);
                        if (next[key] === undefined) {
                            next[key] = batch[id] ?? [];
                        }
                    }
                    return next;
                });
            } catch (error) {
                console.error("Error fetching media list membership:", error);
            }
        },
        [supabase, user]
    );

    const ensureSingleMediaMembership = useCallback(
        async (mediaId: string, mediaType: "movie" | "tv") => {
            const key = membershipKey(mediaType, mediaId);
            const cached = mediaListMapRef.current[key];
            if (cached !== undefined) {
                return cached;
            }

            try {
                const listIds = await getListsForMedia(supabase, mediaId, mediaType);
                setMediaListMap((prev) => {
                    if (prev[key] !== undefined) return prev;
                    return { ...prev, [key]: listIds };
                });
                return listIds;
            } catch (error) {
                console.error("Error fetching media list membership:", error);
                return [];
            }
        },
        [supabase]
    );

    const addToList = useCallback(
        async (media: MediaRef, listId: string) => {
            if (!user) return;
            if (!canEditList(listId)) {
                toast({
                    title: "Kan ikke redigere",
                    description: "Du har bare lesetilgang til denne listen",
                    variant: "destructive",
                });
                return;
            }

            const listName = getListName(listId) ?? "listen";
            updateMediaMap(media.mediaType, media.mediaId, listId, true);
            setLastUsedListId(listId);
            setLastUsedListIdState(listId);

            try {
                const result = await addToListRepo(supabase, {
                    mediaId: media.mediaId,
                    listId,
                    mediaType: media.mediaType,
                    title: media.title,
                    posterPath: media.posterPath,
                    addedBy: user.id,
                    releaseDate: media.releaseDate,
                });

                if (result === "already_exists") {
                    toast({
                        title: "Allerede i listen",
                        description: `"${media.title}" finnes allerede i "${listName}"`,
                    });
                    return;
                }

                toast({
                    title: `${mediaLabel(media.mediaType)} lagt til`,
                    description: `"${media.title}" er lagt til i "${listName}"`,
                    className: "bg-blue-800",
                });
            } catch (error) {
                updateMediaMap(media.mediaType, media.mediaId, listId, false);
                console.error("Error adding to list:", error);
                toast({
                    title: "Feil",
                    description: `Kunne ikke legge til ${mediaLabel(media.mediaType).toLowerCase()} i listen`,
                    variant: "destructive",
                });
            }
        },
        [user, canEditList, getListName, updateMediaMap, supabase]
    );

    const addToLastUsedList = useCallback(
        async (media: MediaRef) => {
            const listId = lastUsedListId ?? lists.owned[0]?.id ?? editableShared[0]?.id ?? null;
            if (!listId) {
                toast({
                    title: "Ingen liste",
                    description: "Opprett en liste først under Dine lister",
                    variant: "destructive",
                });
                return false;
            }

            await addToList(media, listId);
            return true;
        },
        [lastUsedListId, lists.owned, editableShared, addToList]
    );

    const removeFromList = useCallback(
        async (media: MediaRef, listId: string, options?: { alsoRemoveWatched?: boolean }) => {
            if (!canEditList(listId)) return;

            const listName = getListName(listId) ?? "listen";
            updateMediaMap(media.mediaType, media.mediaId, listId, false);

            try {
                await removeFromListRepo(supabase, {
                    mediaId: media.mediaId,
                    listId,
                    mediaType: media.mediaType,
                    alsoRemoveWatched: options?.alsoRemoveWatched,
                });

                toast({
                    title: `${mediaLabel(media.mediaType)} fjernet`,
                    description: `"${media.title}" er fjernet fra "${listName}"`,
                    className: "bg-orange-800",
                });
            } catch (error) {
                updateMediaMap(media.mediaType, media.mediaId, listId, true);
                console.error("Error removing from list:", error);
                toast({
                    title: "Feil",
                    description: `Kunne ikke fjerne ${mediaLabel(media.mediaType).toLowerCase()} fra listen`,
                    variant: "destructive",
                });
            }
        },
        [canEditList, getListName, updateMediaMap, supabase]
    );

    const toggleListMembership = useCallback(
        async (media: MediaRef, listId: string, isMember: boolean) => {
            if (isMember) {
                await removeFromList(media, listId);
            } else {
                await addToList(media, listId);
            }
        },
        [addToList, removeFromList]
    );

    const createListByName = useCallback(
        async (name: string): Promise<List | null> => {
            if (!user) return null;

            const trimmed = name.trim();
            if (!trimmed) return null;

            try {
                const newList = await createList(supabase, { name: trimmed, ownerId: user.id });
                refreshRequestIdRef.current += 1;
                setListsState({
                    owned: [newList, ...listsRef.current.owned],
                    shared: listsRef.current.shared,
                });
                await refreshLists({ silent: true });
                return newList;
            } catch (error) {
                console.error("Error creating list:", error);
                toast({
                    title: "Kunne ikke opprette liste",
                    description: "Det oppstod en feil",
                    variant: "destructive",
                });
                return null;
            }
        },
        [user, supabase, setListsState, refreshLists]
    );

    const createListAndAdd = useCallback(
        async (name: string, media: MediaRef) => {
            const newList = await createListByName(name);
            if (!newList) return;
            await addToList(media, newList.id);
        },
        [createListByName, addToList]
    );

    const value = useMemo(
        () => ({
            lists,
            editableShared,
            readOnlyShared,
            isLoadingLists,
            lastUsedListId,
            mediaListMap,
            membershipVersion,
            getListName,
            getMediaListIds,
            ensureMediaMembership,
            ensureSingleMediaMembership,
            addToList,
            addToLastUsedList,
            removeFromList,
            toggleListMembership,
            createListAndAdd,
            createList: createListByName,
            refreshLists,
            canEditList,
        }),
        [
            lists,
            editableShared,
            readOnlyShared,
            isLoadingLists,
            lastUsedListId,
            mediaListMap,
            membershipVersion,
            getListName,
            getMediaListIds,
            ensureMediaMembership,
            ensureSingleMediaMembership,
            addToList,
            addToLastUsedList,
            removeFromList,
            toggleListMembership,
            createListAndAdd,
            createListByName,
            refreshLists,
            canEditList,
        ]
    );

    return <ListActionsContext.Provider value={value}>{children}</ListActionsContext.Provider>;
}

export function useListActions() {
    const context = useContext(ListActionsContext);
    if (!context) {
        throw new Error("useListActions must be used inside ListActionsProvider");
    }
    return context;
}
