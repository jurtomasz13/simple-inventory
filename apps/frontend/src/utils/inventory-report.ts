import type { InventoryItem } from "@/api/inventory-items";
import type { ProductUnit } from "@/api/products";

export type ReportUnit = ProductUnit | "UNKNOWN";
export type ReportSortField = "name" | "code" | "quantity" | "sold" | "adjusted" | "entries" | "rooms";
export type ReportSortDirection = "asc" | "desc";

export type ProductSaleTotal = {
  quantity: number;
  orderCount: number;
};

export type RoomTotal = {
  id: string;
  name: string;
  quantity: number;
  entryCount: number;
};

export type ProductTotal = {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  categoryName: string;
  unit: ReportUnit;
  quantity: number;
  soldQuantity: number;
  adjustedQuantity: number;
  orderCount: number;
  entryCount: number;
  rooms: RoomTotal[];
};

export type UnitReportGroup = {
  unit: ReportUnit;
  quantity: number;
  entryCount: number;
  productCount: number;
  soldQuantity: number;
  adjustedQuantity: number;
  products: ProductTotal[];
};

export type CategoryReportGroup = {
  id: string;
  name: string;
  entryCount: number;
  productCount: number;
  units: UnitReportGroup[];
};

const unitOrder: Record<ReportUnit, number> = {
  PIECE: 0,
  KILOGRAM: 1,
  LITER: 2,
  UNKNOWN: 3,
};

function compareProducts(a: ProductTotal, b: ProductTotal, field: ReportSortField) {
  switch (field) {
    case "code":
      return a.code.localeCompare(b.code, "pl", { numeric: true });
    case "quantity":
      return a.quantity - b.quantity;
    case "sold":
      return a.soldQuantity - b.soldQuantity;
    case "adjusted":
      return a.adjustedQuantity - b.adjustedQuantity;
    case "entries":
      return a.entryCount - b.entryCount;
    case "rooms":
      return a.rooms.length - b.rooms.length;
    default:
      return a.name.localeCompare(b.name, "pl", { numeric: true });
  }
}

export function buildInventoryReport(
  items: InventoryItem[],
  sortField: ReportSortField,
  sortDirection: ReportSortDirection,
  salesByProduct: Map<string, ProductSaleTotal> = new Map()
): CategoryReportGroup[] {
  const productTotals = new Map<string, ProductTotal>();

  items.forEach((item) => {
    const productKey = item.product?.id ?? `deleted-${item.id}`;
    const categoryId = item.product?.category?.id ?? "none";
    const current = productTotals.get(productKey) ?? {
      id: productKey,
      name: item.product?.name ?? "Produkt usunięty",
      code: item.product?.code ?? "—",
      categoryId,
      categoryName: item.product?.category?.name ?? "Bez kategorii",
      unit: item.product?.unit ?? "UNKNOWN",
      quantity: 0,
      soldQuantity: 0,
      adjustedQuantity: 0,
      orderCount: 0,
      entryCount: 0,
      rooms: [],
    };

    current.quantity += item.quantity;
    current.entryCount += 1;

    const roomId = item.room?.id ?? "deleted";
    const room = current.rooms.find((entry) => entry.id === roomId);
    if (room) {
      room.quantity += item.quantity;
      room.entryCount += 1;
    } else {
      current.rooms.push({
        id: roomId,
        name: item.room?.name ?? "Strefa usunięta",
        quantity: item.quantity,
        entryCount: 1,
      });
    }

    productTotals.set(productKey, current);
  });

  productTotals.forEach((product) => {
    const sale = salesByProduct.get(product.id);
    product.soldQuantity = sale?.quantity ?? 0;
    product.adjustedQuantity = product.quantity - product.soldQuantity;
    product.orderCount = sale?.orderCount ?? 0;
  });

  const categories = new Map<string, CategoryReportGroup>();

  productTotals.forEach((product) => {
    const category = categories.get(product.categoryId) ?? {
      id: product.categoryId,
      name: product.categoryName,
      entryCount: 0,
      productCount: 0,
      units: [],
    };
    let unit = category.units.find((entry) => entry.unit === product.unit);

    if (!unit) {
      unit = {
        unit: product.unit,
        quantity: 0,
        soldQuantity: 0,
        adjustedQuantity: 0,
        entryCount: 0,
        productCount: 0,
        products: [],
      };
      category.units.push(unit);
    }

    product.rooms.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    unit.products.push(product);
    unit.quantity += product.quantity;
    unit.soldQuantity += product.soldQuantity;
    unit.adjustedQuantity += product.adjustedQuantity;
    unit.entryCount += product.entryCount;
    unit.productCount += 1;
    category.entryCount += product.entryCount;
    category.productCount += 1;
    categories.set(category.id, category);
  });

  const direction = sortDirection === "asc" ? 1 : -1;

  return [...categories.values()]
    .sort((a, b) => a.name.localeCompare(b.name, "pl"))
    .map((category) => ({
      ...category,
      units: category.units
        .sort((a, b) => unitOrder[a.unit] - unitOrder[b.unit])
        .map((unit) => ({
          ...unit,
          products: unit.products.sort(
            (a, b) => compareProducts(a, b, sortField) * direction
          ),
        })),
    }));
}

export function createReportUnitTotals(items: InventoryItem[]) {
  return items.reduce<Record<ReportUnit, number>>(
    (totals, item) => {
      totals[item.product?.unit ?? "UNKNOWN"] += item.quantity;
      return totals;
    },
    { PIECE: 0, KILOGRAM: 0, LITER: 0, UNKNOWN: 0 }
  );
}
