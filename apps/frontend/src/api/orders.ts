import { api } from "@/lib/axios";
import type { Inventory } from "./inventories";
import type { InventoryItemProduct } from "./inventory-items";

export type OrderLineInput = {
  productId: string;
  quantity: number;
};

export type CreateOrder = {
  name: string;
  inventoryId: string;
  orderItems: OrderLineInput[];
};

export type UpdateOrder = Partial<CreateOrder>;

export type OrderItem = {
  id: string;
  quantity: number;
  productId: string | null;
  orderId: string;
  product?: InventoryItemProduct | null;
};

export type Order = {
  id: string;
  name: string;
  inventoryId: string | null;
  createdAt: string;
  updatedAt: string;
  inventory?: Pick<Inventory, "id" | "name" | "date"> | null;
  orderItems: OrderItem[];
};

export const QUERY_KEY_ORDERS = ["orders"] as const;

export async function fetchOrders(inventoryId?: string): Promise<Order[]> {
  const response = await api.get<Order[]>("/order", {
    params: inventoryId ? { inventoryId } : undefined,
  });
  return response.data;
}

export async function createOrder(order: CreateOrder): Promise<Order> {
  const response = await api.post<Order>("/order", order);
  return response.data;
}

export async function updateOrder(id: string, order: UpdateOrder): Promise<Order> {
  const response = await api.patch<Order>(`/order/${id}`, order);
  return response.data;
}

export async function deleteOrder(id: string): Promise<null> {
  const response = await api.delete(`/order/${id}`);
  return response.data;
}
