import { createInventory, deleteInventory, fetchInventory, fetchInventories, QUERY_KEY_INVENTORIES, updateInventory, type CreateInventory } from "@/api/inventories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useInventories = () => {
    return useQuery({ queryKey: QUERY_KEY_INVENTORIES, queryFn: fetchInventories });
};

export const useInventory = (id: string) => {
    return useQuery({ queryKey: [...QUERY_KEY_INVENTORIES, id], queryFn: () => fetchInventory(id) });
};

export const useCreateInventory = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createInventory,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_INVENTORIES }),
    })
};

export const useUpdateInventory = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<CreateInventory> }) =>
        updateInventory(id, updates),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_INVENTORIES }),
    })
};

export const useDeleteInventory = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteInventory,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_INVENTORIES }),
    })
};

export const useInventoryMutations = () => ({
    createInventoryMutation: useCreateInventory(),
    updateInventoryMutation: useUpdateInventory(),
    deleteInventoryMutation: useDeleteInventory(),
});
