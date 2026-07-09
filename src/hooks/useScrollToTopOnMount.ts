import { useLayoutEffect } from "react";

export function useScrollToTopOnMount(key: string) {
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, [key]);
}
