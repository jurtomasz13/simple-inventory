export type SortField = { field: string; dir: string };

export const parseSortParam = (param: string | null): SortField => {
    if (!param) return { field: "name", dir: "ASC" };
    const [field, dir] = param.split("+");
    return { field, dir: dir?.toUpperCase() === "DESC" ? "DESC" : "ASC" };
};

export const getNextSortDir = (dir?: string): string =>
    dir ? (dir === "DESC" ? "ASC" : "DESC") : "ASC";

