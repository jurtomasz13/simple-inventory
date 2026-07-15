import type { CreateInventoryItem, InventoryItem } from "@/api/inventory-items";
import type { Product } from "@/api/products";
import type { Room } from "@/api/rooms";
import { BarcodeScannerButton } from "@/app/components/barcode-scanner";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { normalizedProductCode } from "@/utils/barcode";
import { normalizeSearch, unitLabels } from "@/utils/inventory";
import { Minus, Plus, Search } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";

type InventoryItemFormProps = {
  inventoryId: string;
  products: Product[];
  rooms: Room[];
  editingItem?: InventoryItem | null;
  isPending?: boolean;
  onSubmit: (data: CreateInventoryItem) => void;
  onCancel?: () => void;
  onProductNotFound?: (code: string) => void;
  initialProductCode?: string;
  onInitialProductSelected?: () => void;
};

const getLastRoom = () => localStorage.getItem("inventory:last-room") ?? "";

export function InventoryItemForm({
  inventoryId,
  products,
  rooms,
  editingItem,
  isPending,
  onSubmit,
  onCancel,
  onProductNotFound,
  initialProductCode,
  onInitialProductSelected,
}: InventoryItemFormProps) {
  const [productId, setProductId] = useState(editingItem?.productId ?? "");
  const [productQuery, setProductQuery] = useState("");
  const [roomId, setRoomId] = useState(editingItem?.roomId ?? getLastRoom());
  const [quantity, setQuantity] = useState(String(editingItem?.quantity ?? 1));
  const [isProductListOpen, setIsProductListOpen] = useState(false);
  const [error, setError] = useState("");

  const selectedProduct = products.find((product) => product.id === productId);
  const query = normalizeSearch(productQuery);
  const matchingProducts = useMemo(() => {
    if (!query) return products.slice(0, 8);
    return products
      .filter((product) => normalizeSearch(`${product.name} ${product.code}`).includes(query))
      .slice(0, 8);
  }, [products, query]);

  useEffect(() => {
    setProductId(editingItem?.productId ?? "");
    setProductQuery(editingItem?.product ? `${editingItem.product.code} · ${editingItem.product.name}` : "");
    setRoomId(editingItem?.roomId ?? getLastRoom());
    setQuantity(String(editingItem?.quantity ?? 1));
    setError("");
  }, [editingItem]);

  const selectProduct = (product: Product) => {
    setProductId(product.id);
    setProductQuery(`${product.code} · ${product.name}`);
    setIsProductListOpen(false);
    setError("");
  };

  useEffect(() => {
    if (editingItem || !initialProductCode) return;
    const product = products.find((item) => normalizedProductCode(item.code) === normalizedProductCode(initialProductCode));
    if (!product) return;
    setProductId(product.id);
    setProductQuery(`${product.code} · ${product.name}`);
    setIsProductListOpen(false);
    setError("");
    onInitialProductSelected?.();
  }, [editingItem, initialProductCode, onInitialProductSelected, products]);

  const handleProductKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || matchingProducts.length === 0) return;
    event.preventDefault();
    const exactCode = products.find((product) => normalizeSearch(product.code) === query);
    selectProduct(exactCode ?? matchingProducts[0]);
  };

  const handleScan = (code: string) => {
    const exactProduct = products.find((product) => normalizedProductCode(product.code) === normalizedProductCode(code));
    if (exactProduct) {
      selectProduct(exactProduct);
      return;
    }

    setProductId("");
    setProductQuery(code);
    setIsProductListOpen(false);
    setError(`Kod ${code} nie istnieje jeszcze w katalogu produktów.`);
    onProductNotFound?.(code);
  };

  const changeQuantity = (amount: number) => {
    const current = Number(quantity) || 0;
    const step = selectedProduct?.unit === "PIECE" ? 1 : 0.1;
    setQuantity(String(Math.max(step, Math.round((current + amount * step) * 1000) / 1000)));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const numericQuantity = Number(quantity.replace(",", "."));

    if (!productId) {
      setError("Wybierz produkt z listy lub zatwierdź zeskanowany kod.");
      return;
    }
    if (!roomId) {
      setError("Wybierz strefę, w której znajduje się produkt.");
      return;
    }
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      setError("Ilość musi być większa od zera.");
      return;
    }

    localStorage.setItem("inventory:last-room", roomId);
    setError("");
    onSubmit({ inventoryId, productId, roomId, quantity: numericQuantity });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="relative">
        <Label htmlFor="product-search" className="mb-2">Produkt lub kod</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="product-search"
            value={productQuery}
            onChange={(event) => {
              setProductQuery(event.target.value);
              setProductId("");
              setIsProductListOpen(true);
            }}
            onFocus={() => setIsProductListOpen(true)}
            onBlur={() => window.setTimeout(() => setIsProductListOpen(false), 120)}
            onKeyDown={handleProductKeyDown}
            autoComplete="off"
            placeholder="Skanuj kod lub wpisz nazwę"
            className="h-14 pl-12 pr-14 text-base font-medium"
          />
          <BarcodeScannerButton onDetected={handleScan} iconOnly label="Skanuj kod produktu" className="absolute right-1.5 top-1.5 border-0 bg-transparent shadow-none" />
        </div>

        {isProductListOpen && (
          <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border bg-white p-1.5 shadow-xl">
            {matchingProducts.length > 0 ? matchingProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-3 text-left hover:bg-[#f0f5f1]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectProduct(product)}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{product.name}</span>
                  <span className="block text-xs text-muted-foreground">{product.code}</span>
                </span>
                <span className="rounded-lg bg-muted px-2 py-1 text-xs font-bold">{unitLabels[product.unit]}</span>
              </button>
            )) : (
              <p className="px-4 py-5 text-center text-sm text-muted-foreground">Nie znaleziono produktu.</p>
            )}
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="room" className="mb-2">Strefa sklepu</Label>
        <Select value={roomId || undefined} onValueChange={setRoomId}>
          <SelectTrigger id="room" className="h-14 w-full">
            <SelectValue placeholder="Wybierz miejsce liczenia" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label htmlFor="quantity" className="mb-0">Policzona ilość</Label>
          {selectedProduct && <span className="text-xs font-bold text-primary">Jednostka: {unitLabels[selectedProduct.unit]}</span>}
        </div>
        <div className="grid grid-cols-[56px_1fr_56px] gap-2">
          <Button type="button" variant="outline" className="h-14" onClick={() => changeQuantity(-1)} aria-label="Zmniejsz ilość"><Minus /></Button>
          <Input
            id="quantity"
            type="number"
            inputMode="decimal"
            min="0.001"
            step={selectedProduct?.unit === "PIECE" ? "1" : "0.001"}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="h-14 text-center text-xl font-black"
          />
          <Button type="button" variant="outline" className="h-14" onClick={() => changeQuantity(1)} aria-label="Zwiększ ilość"><Plus /></Button>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800">{error}</p>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Anuluj</Button>}
        <Button type="submit" size="lg" className={onCancel ? "" : "w-full"} disabled={isPending || products.length === 0 || rooms.length === 0}>
          {isPending ? "Zapisywanie…" : editingItem ? "Zapisz pozycję" : "Dodaj policzoną pozycję"}
        </Button>
      </div>
    </form>
  );
}
