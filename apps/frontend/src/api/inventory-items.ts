import { api } from "@/lib/axios";
import type { Product, ProductUnit } from "./products";
import type { Room } from "./rooms";

export type CreateInventoryItem = {
    quantity: number;
    productId: string;
    roomId: string;
    inventoryId: string;
}

export type UpdateInventoryItem = Partial<CreateInventoryItem>;

export type InventoryItemProduct = Pick<Product, "id" | "name" | "code" | "categoryId"> & {
    unit: ProductUnit;
    category?: { id: string; name: string } | null;
};

export type InventoryItem = {
    id: string;
    quantity: number;
    productId: string | null;
    roomId: string | null;
    inventoryId: string;
    createdAt: string;
    updatedAt: string;
    product?: InventoryItemProduct | null;
    room?: Pick<Room, "id" | "name"> | null;
}

export const QUERY_KEY_INVENTORY_ITEMS = ["inventory_items"] as const

export async function fetchInventoryItems(id: string): Promise<InventoryItem[]> {
    const res = await api.get<InventoryItem[]>(`/inventory-item/${id}`);
    return res.data;
}

export async function fetchInventoryItem(id: string): Promise<InventoryItem> {
    const res = await api.get<InventoryItem>(`/inventory-item/position/${id}`);
    return res.data;
}

export async function createInventoryItem(
    item: CreateInventoryItem
): Promise<InventoryItem> {
    const res = await api.post<InventoryItem>("/inventory-item", item)
    return res.data
}

export async function updateInventoryItem(
    id: string,
    updates: UpdateInventoryItem
): Promise<InventoryItem> {
    const res = await api.patch<InventoryItem>(`/inventory-item/${id}`, updates)
    return res.data
}

export async function deleteInventoryItem(id: string): Promise<null> {
    const res = await api.delete(`/inventory-item/${id}`)
    return res.data
}
