const LAST_USED_LIST_KEY = "filmlista:last-used-list-id";

export function getLastUsedListId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(LAST_USED_LIST_KEY);
}

export function setLastUsedListId(listId: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(LAST_USED_LIST_KEY, listId);
}

export function membershipKey(mediaType: "movie" | "tv", mediaId: string): string {
    return `${mediaType}:${mediaId}`;
}
