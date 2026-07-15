import {
  createOrder,
  deleteOrder,
  fetchOrders,
  QUERY_KEY_ORDERS,
  updateOrder,
  type UpdateOrder,
} from "@/api/orders";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useOrders = (inventoryId?: string) => useQuery({
  queryKey: [...QUERY_KEY_ORDERS, inventoryId ?? "all"],
  queryFn: () => fetchOrders(inventoryId),
  enabled: inventoryId !== "",
});

export const useOrderMutations = () => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY_ORDERS });

  return {
    createOrderMutation: useMutation({ mutationFn: createOrder, onSuccess: invalidate }),
    updateOrderMutation: useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: UpdateOrder }) => updateOrder(id, updates),
      onSuccess: invalidate,
    }),
    deleteOrderMutation: useMutation({ mutationFn: deleteOrder, onSuccess: invalidate }),
  };
};
