import { create } from "zustand";

type Filters = {
    category: string;
};

type Sorting = {
    column: string;
    direction: "ASC" | "DESC";
};

type Pagination = {
    page: number;
    pageSize: number;
};

type InventoryStore = {
    filters: Filters;
    setFilter: (key: keyof Filters, value: string) => void;
    sorting: Sorting;
    setSorting: (column: string, direction: "ASC" | "DESC") => void;
    pagination: Pagination;
    setPage: (page: number) => void;
    setPageSize: (size: number) => void;
};

export const useInventoryStore = create<InventoryStore>((set) => ({
    filters: { category: "" },
    setFilter: (key, value) => 
        set((state) => ({
            filters: { ...state.filters, [key]: value },
        })),
    sorting: { column: "name", direction: "ASC" },
    setSorting: (column, direction) =>
        set({ sorting: { column, direction }}),
    pagination: { page: 1, pageSize: 10 },
    setPage: (page) =>
        set((state) => ({ pagination: { ...state.pagination, page }})),
    setPageSize: (size) =>
        set((state) => ({ pagination: { ...state.pagination, pageSize: size, page: 1 }}))
}));

export default useInventoryStore;
