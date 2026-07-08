import { useListActions } from "@/contexts/ListActionsContext";

export function useMovieLists() {
    const { lists } = useListActions();
    return { lists };
}
