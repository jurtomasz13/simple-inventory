import { api } from "@/lib/axios";
import { ProductFormValues } from "@/app/components/forms/product-form";

export type ProductUnit = "PIECE" | "KILOGRAM" | "LITER";

export type CreateProduct = {
    name: string;
    code: string;
    unit: ProductUnit;
    categoryId: string;
}

export type UpdateProduct = CreateProduct;

export type Product = {
    id: string;
    name: string;
    code: string;
    unit: ProductUnit;
    userId: string;
    categoryId: string;
    createdAt: string;
    updatedAt: string;
    category?: { id: string; name: string } | null;
}

export const QUERY_KEY_PRODUCTS = ["products"] as const

export async function fetchProducts(): Promise<Product[]> {
    const res = await api.get<Product[]>("/product");
    return res.data;
}

export async function fetchProduct(id: string): Promise<Product> {
    const res = await api.get<Product>(`/product/${id}`);
    return res.data;
}

export async function createProduct(
    product: ProductFormValues
): Promise<Product> {
    const res = await api.post<Product>("/product", product)
    return res.data
}

export async function updateProduct(
    id: string,
    updates: ProductFormValues
): Promise<Product> {
    const res = await api.patch<Product>(`/product/${id}`, updates)
    return res.data
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await api.delete<{ success: boolean }>(`/product/${id}`)
    return res.data
}
