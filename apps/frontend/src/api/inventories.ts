import { api } from "@/lib/axios";

export type CreateInventory = {
    name: string;
    date: string | Date;
}

export type UpdateInventory = CreateInventory;

export type Inventory = {
    id: string;
    name: string;
    date: string;
    createdAt: string;
    updatedAt: string;
    itemCount?: number;
}

export const QUERY_KEY_INVENTORIES = ["inventories"] as const

export async function fetchInventories(): Promise<Inventory[]> {
    const res = await api.get<Inventory[]>("/inventory");
    return res.data;
}

export async function fetchInventory(id: string): Promise<Inventory> {
    const res = await api.get<Inventory>(`/inventory/${id}`);
    return res.data;
}

export async function createInventory(
    inventory: CreateInventory
): Promise<Inventory> {
    const res = await api.post<Inventory>("/inventory", inventory)
    return res.data
}

export async function updateInventory(
    id: string,
    updates: Partial<CreateInventory>
): Promise<Inventory> {
    const res = await api.patch<Inventory>(`/inventory/${id}`, updates)
    return res.data
}

export async function deleteInventory(id: string): Promise<null> {
    const res = await api.delete(`/inventory/${id}`)
    return res.data
}
