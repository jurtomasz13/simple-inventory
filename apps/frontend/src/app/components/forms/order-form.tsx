import type { InventoryItemProduct } from "@/api/inventory-items";
import type { CreateOrder, Order } from "@/api/orders";
import { BarcodeScannerButton } from "@/app/components/barcode-scanner";
import { normalizedProductCode } from "@/utils/barcode";
import { formatQuantity, normalizeSearch, unitLabels } from "@/utils/inventory";
import { Minus, Plus, ReceiptText, Search, Trash2 } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

type OrderFormProps = {
  inventoryId: string;
  products: InventoryItemProduct[];
  editingOrder?: Order | null;
  isPending?: boolean;
  onSubmit: (data: CreateOrder) => void;
  onCancel?: () => void;
};

type OrderFormLine = {
  product: InventoryItemProduct;
  quantity: number;
};

const defaultReceiptName = () => `Paragon ${new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(new Date())}`;

export function OrderForm({ inventoryId, products, editingOrder, isPending, onSubmit, onCancel }: OrderFormProps) {
  const [name, setName] = useState(editingOrder?.name ?? defaultReceiptName());
  const [productQuery, setProductQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [lines, setLines] = useState<OrderFormLine[]>([]);
  const [isProductListOpen, setIsProductListOpen] = useState(false);
  const [error, setError] = useState("");
  const [missingCode, setMissingCode] = useState("");
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const query = normalizeSearch(productQuery);

  const matchingProducts = useMemo(() => {
    if (!query) return products.slice(0, 8);
    return products.filter((product) => normalizeSearch(`${product.name} ${product.code}`).includes(query)).slice(0, 8);
  }, [products, query]);

  useEffect(() => {
    setName(editingOrder?.name ?? defaultReceiptName());
    setLines(editingOrder?.orderItems.flatMap((item) => {
      if (!item.product) return [];
      return [{ product: item.product, quantity: item.quantity }];
    }) ?? []);
    setProductQuery("");
    setSelectedProductId("");
    setQuantity("1");
    setError("");
    setMissingCode("");
  }, [editingOrder]);

  const selectProduct = (product: InventoryItemProduct) => {
    setSelectedProductId(product.id);
    setProductQuery(`${product.code} · ${product.name}`);
    setIsProductListOpen(false);
    setError("");
    setMissingCode("");
  };

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

    setSelectedProductId("");
    setProductQuery(code);
    setIsProductListOpen(false);
    setMissingCode(code);
    setError("Tego produktu nie ma w policzonych pozycjach. Najpierw dodaj go do inwentaryzacji, a potem wróć do paragonu.");
  };

  const addLine = () => {
    const numericQuantity = Number(quantity.replace(",", "."));
    if (!selectedProduct || !Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      setError("Wybierz policzony produkt i podaj ilość większą od zera.");
      return;
    }
    setLines((current) => {
      const existing = current.find((line) => line.product.id === selectedProduct.id);
      if (existing) return current.map((line) => line.product.id === selectedProduct.id ? { ...line, quantity: line.quantity + numericQuantity } : line);
      return [...current, { product: selectedProduct, quantity: numericQuantity }];
    });
    setProductQuery("");
    setSelectedProductId("");
    setQuantity("1");
    setError("");
  };

  const updateLineQuantity = (productId: string, value: string) => {
    const quantity = Number(value.replace(",", "."));
    if (!Number.isFinite(quantity)) return;
    setLines((current) => current.map((line) => line.product.id === productId ? { ...line, quantity } : line));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim().length < 2) return setError("Nadaj paragonowi krótką nazwę lub numer.");
    if (lines.length === 0 || lines.some((line) => line.quantity <= 0)) return setError("Paragon musi zawierać co najmniej jedną poprawną pozycję.");
    onSubmit({
      name: name.trim(),
      inventoryId,
      orderItems: lines.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div><Label htmlFor="receipt-name" className="mb-2">Nazwa lub numer paragonu</Label><Input id="receipt-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="np. Paragon 21:45" /></div>

      <div className="rounded-2xl border bg-[#f5f6f2] p-3">
        <Label htmlFor="receipt-product" className="mb-2">Dodaj produkt z paragonu</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input id="receipt-product" value={productQuery} onChange={(event) => { setProductQuery(event.target.value); setSelectedProductId(""); setMissingCode(""); setIsProductListOpen(true); }} onFocus={() => setIsProductListOpen(true)} onBlur={() => window.setTimeout(() => setIsProductListOpen(false), 120)} onKeyDown={handleProductKeyDown} autoComplete="off" placeholder="Skanuj kod lub wpisz nazwę" className="pl-12 pr-14" />
          <BarcodeScannerButton onDetected={handleScan} iconOnly label="Skanuj produkt z paragonu" className="absolute right-1 top-1/2 -translate-y-1/2 border-0 bg-transparent shadow-none" />
          {isProductListOpen && <div className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border bg-white p-1.5 shadow-xl">{matchingProducts.length ? matchingProducts.map((product) => <button key={product.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectProduct(product)} className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-3 text-left hover:bg-muted"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{product.name}</span><span className="block text-xs text-muted-foreground">{product.code}</span></span><span className="rounded-lg bg-muted px-2 py-1 text-xs font-bold">{unitLabels[product.unit]}</span></button>) : <p className="px-4 py-5 text-center text-sm text-muted-foreground">Produkt nie został policzony w tej inwentaryzacji.</p>}</div>}
        </div>
        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2"><Input type="number" inputMode="decimal" min="0.001" step={selectedProduct?.unit === "PIECE" ? "1" : "0.001"} value={quantity} onChange={(event) => setQuantity(event.target.value)} aria-label="Ilość sprzedana" /><Button type="button" onClick={addLine}><Plus /> Dodaj</Button></div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold">Pozycje paragonu</p><span className="text-xs text-muted-foreground">{lines.length}</span></div>
        {lines.length === 0 ? <div className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground"><ReceiptText className="mx-auto mb-2 size-6" />Dodaj produkty kupione przez klienta.</div> : <div className="space-y-2">{lines.map((line) => <div key={line.product.id} className="grid grid-cols-[minmax(0,1fr)_112px_44px] items-center gap-2 rounded-2xl border bg-white p-2.5"><div className="min-w-0 pl-1"><p className="truncate text-sm font-bold">{line.product.name}</p><p className="text-xs text-muted-foreground">{line.product.code} · {formatQuantity(line.quantity, line.product.unit)}</p></div><div className="grid grid-cols-[32px_1fr_32px] items-center"><Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => updateLineQuantity(line.product.id, String(Math.max(line.product.unit === "PIECE" ? 1 : 0.001, Math.round((line.quantity - (line.product.unit === "PIECE" ? 1 : 0.1)) * 1000) / 1000)))}><Minus /></Button><Input type="number" min="0.001" step={line.product.unit === "PIECE" ? "1" : "0.001"} value={line.quantity} onChange={(event) => updateLineQuantity(line.product.id, event.target.value)} className="h-9 px-1 text-center text-sm font-bold" /><Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => updateLineQuantity(line.product.id, String(Math.round((line.quantity + (line.product.unit === "PIECE" ? 1 : 0.1)) * 1000) / 1000))}><Plus /></Button></div><Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => setLines((current) => current.filter((item) => item.product.id !== line.product.id))}><Trash2 /></Button></div>)}</div>}
      </div>

      {error && <div className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800"><p>{error}</p>{missingCode && <Link className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-white px-3 font-bold underline" to={`/inventory/${inventoryId}/positions?code=${encodeURIComponent(missingCode)}`}>Przejdź do liczenia kodu {missingCode}</Link>}</div>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>Anuluj</Button>}<Button type="submit" size="lg" className={onCancel ? "" : "w-full"} disabled={isPending || products.length === 0}>{isPending ? "Zapisywanie…" : editingOrder ? "Zapisz paragon" : "Zarejestruj sprzedaż"}</Button></div>
    </form>
  );
}
