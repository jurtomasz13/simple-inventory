import type { ProductUnit } from "@/api/products";

export const unitLabels: Record<ProductUnit, string> = {
  PIECE: "szt.",
  KILOGRAM: "kg",
  LITER: "l",
};

export function formatQuantity(quantity: number, unit: ProductUnit) {
  return `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 3 }).format(quantity)} ${unitLabels[unit]}`;
}

export function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("pl-PL");
}
