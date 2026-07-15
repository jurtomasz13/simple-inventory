import { createInventoryItem, deleteInventoryItem, fetchInventoryItems, fetchInventoryItem, QUERY_KEY_INVENTORY_ITEMS, updateInventoryItem, type UpdateInventoryItem } from "@/api/inventory-items";
import { QUERY_KEY_INVENTORIES } from "@/api/inventories";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useInventoryItems = (inventoryId: string) => {
    return useQuery({
        queryKey: [...QUERY_KEY_INVENTORY_ITEMS, inventoryId],
        queryFn: () => fetchInventoryItems(inventoryId),
        enabled: Boolean(inventoryId),
    });
};

export const useInventoryItem = (id: string) => {
    return useQuery({ queryKey: [...QUERY_KEY_INVENTORY_ITEMS, id], queryFn: () => fetchInventoryItem(id) });
};

export const useCreateInventoryItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createInventoryItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY_INVENTORY_ITEMS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEY_INVENTORIES });
        },
    })
};

export const useUpdateInventoryItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: UpdateInventoryItem }) =>
        updateInventoryItem(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY_INVENTORY_ITEMS });
            queryClient.invalidateQueries({ queryKey: QUERY_KEY_INVENTORIES });
        },
    })
};

export const useDeleteInventoryItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteInventoryItem,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_INVENTORY_ITEMS }),
    })
};

export const useInventoryMutations = () => ({
    createInventoryMutation: useCreateInventoryItem(),
    updateInventoryMutation: useUpdateInventoryItem(),
    deleteInventoryMutation: useDeleteInventoryItem(),
});
