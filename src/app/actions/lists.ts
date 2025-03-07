import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createList(name: string, owner_id: string) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase.from("lists").insert([{ name, owner_id }]).select().single();

        if (error) throw error;

        revalidatePath("/lists");
        return { success: true, list: data };
    } catch (error) {
        console.error("Error creating list:", error);
        return { success: false, error: "Failed to create list" };
    }
}

export async function shareList(list_id: string, user_id: string) {
    const supabase = await createClient();

    try {
        const { error } = await supabase.from("shared_lists").insert([{ list_id, user_id }]);

        if (error) throw error;

        revalidatePath("/lists");
        return { success: true };
    } catch (error) {
        console.error("Error sharing list:", error);
        return { success: false, error: "Failed to share list" };
    }
}

export async function getUserLists(userId: string) {
    const supabase = await createClient();

    try {
        // Get owned lists
        const { data: ownedLists, error: ownedError } = await supabase.from("lists").select("*").eq("owner_id", userId);

        if (ownedError) throw ownedError;

        // Get shared lists
        const { data: sharedLists, error: sharedError } = await supabase
            .from("shared_lists")
            .select("list_id, lists(*)")
            .eq("user_id", userId);

        if (sharedError) throw sharedError;

        return {
            success: true,
            owned: ownedLists,
            shared: sharedLists.map((item) => item.lists),
        };
    } catch (error) {
        console.error("Error fetching lists:", error);
        return { success: false, error: "Failed to fetch lists" };
    }
}
