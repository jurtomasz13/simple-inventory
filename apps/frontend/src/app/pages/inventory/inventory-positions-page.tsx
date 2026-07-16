import type { CreateInventoryItem, InventoryItem } from "@/api/inventory-items";
import type { Product } from "@/api/products";
import { InventoryItemForm } from "@/app/components/forms/inventory-item-form";
import { LoadingState } from "@/app/components/loading-state";
import { ProductForm, type ProductFormValues } from "@/app/components/forms/product-form";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useInventory } from "@/hooks/inventories";
import { useCategories } from "@/hooks/categories";
import { useProductMutations, useProducts } from "@/hooks/products";
import { useRooms } from "@/hooks/rooms";
import { useInventoryItems, useInventoryMutations } from "@/hooks/use-inventory-items";
import { normalizedProductCode } from "@/utils/barcode";
import { formatQuantity, normalizeSearch, unitLabels } from "@/utils/inventory";
import { ArrowLeft, Check, ClipboardCheck, Edit3, MapPin, PackageOpen, ReceiptText, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

export function InventoryPositionsPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedProductCode = searchParams.get("code")?.trim() ?? "";
  const { data: inventory, isLoading: isLoadingInventory } = useInventory(id);
  const { data: inventoryItems = [], isLoading: isLoadingItems, error } = useInventoryItems(id);
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  const { data: catalogCategories = [], isLoading: isLoadingCategories } = useCategories();
  const { data: rooms = [], isLoading: isLoadingRooms } = useRooms();
  const { createProductMutation } = useProductMutations();
  const { createInventoryMutation, updateInventoryMutation, deleteInventoryMutation } = useInventoryMutations();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [entryVersion, setEntryVersion] = useState(0);
  const [savedMessage, setSavedMessage] = useState("");
  const [quickProductCode, setQuickProductCode] = useState("");
  const [isQuickProductDialogOpen, setIsQuickProductDialogOpen] = useState(false);
  const [quickAddedProduct, setQuickAddedProduct] = useState<Product | null>(null);
  const [productCodeToSelect, setProductCodeToSelect] = useState("");

  const availableProducts = useMemo(() => {
    if (!quickAddedProduct || products.some((product) => product.id === quickAddedProduct.id)) return products;
    return [quickAddedProduct, ...products];
  }, [products, quickAddedProduct]);

  useEffect(() => {
    if (!requestedProductCode || isLoadingProducts) return;
    const existingProduct = products.find((product) => normalizedProductCode(product.code) === normalizedProductCode(requestedProductCode));

    if (existingProduct) {
      setProductCodeToSelect(existingProduct.code);
    } else {
      setQuickProductCode(requestedProductCode);
      setIsQuickProductDialogOpen(true);
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("code");
    setSearchParams(nextParams, { replace: true });
  }, [isLoadingProducts, products, requestedProductCode, searchParams, setSearchParams]);

  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    inventoryItems.forEach((item) => {
      if (item.product?.category) unique.set(item.product.category.id, item.product.category.name);
    });
    return [...unique.entries()].sort((a, b) => a[1].localeCompare(b[1], "pl"));
  }, [inventoryItems]);

  const filteredItems = useMemo(() => {
    const query = normalizeSearch(searchTerm);
    return inventoryItems
      .filter((item) => {
        const matchesQuery = !query || normalizeSearch(`${item.product?.name ?? ""} ${item.product?.code ?? ""}`).includes(query);
        const matchesCategory = categoryFilter === "all" || item.product?.category?.id === categoryFilter;
        const matchesRoom = roomFilter === "all" || item.room?.id === roomFilter;
        return matchesQuery && matchesCategory && matchesRoom;
      })
      .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));
  }, [inventoryItems, searchTerm, categoryFilter, roomFilter]);

  const handleCreate = (data: CreateInventoryItem) => {
    setSavedMessage("");
    createInventoryMutation.mutate(data, {
      onSuccess: () => {
        setEntryVersion((version) => version + 1);
        setSavedMessage("Pozycja zapisana");
        window.setTimeout(() => setSavedMessage(""), 2200);
      },
    });
  };

  const handleUpdate = (data: CreateInventoryItem) => {
    if (!editingItem) return;
    updateInventoryMutation.mutate(
      { id: editingItem.id, updates: data },
      { onSuccess: () => setEditingItem(null) }
    );
  };

  const handleDelete = (item: InventoryItem) => {
    if (window.confirm(`Usunąć pozycję „${item.product?.name ?? "produkt usunięty"}”?`)) {
      deleteInventoryMutation.mutate(item.id);
    }
  };

  const handleQuickProductCreate = (data: ProductFormValues) => {
    createProductMutation.mutate(data, {
      onSuccess: (product) => {
        setQuickAddedProduct(product);
        setProductCodeToSelect(product.code);
        setIsQuickProductDialogOpen(false);
        setQuickProductCode("");
        setSavedMessage("Produkt dodany do katalogu");
        window.setTimeout(() => setSavedMessage(""), 2200);
      },
    });
  };

  const openQuickProductDialog = (code = "") => {
    createProductMutation.reset();
    setQuickProductCode(code);
    setIsQuickProductDialogOpen(true);
  };

  const closeQuickProductDialog = () => {
    setIsQuickProductDialogOpen(false);
    setQuickProductCode("");
  };

  const isLoading = isLoadingInventory || isLoadingItems || isLoadingProducts || isLoadingCategories || isLoadingRooms;

  return (
    <div className="app-page space-y-6">
      <div className="app-page-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to="/inventory" className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Wszystkie inwentaryzacje
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Pozycje inwentaryzacji</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.035em] sm:text-4xl">{inventory?.name ?? "Inwentaryzacja"}</h1>
          <p className="mt-2 text-muted-foreground">Dodawaj pozycje kolejno, strefa po strefie. Ostatnio wybrana strefa zostanie zapamiętana.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild variant="outline" size="lg"><Link to={`/orders?inventory=${id}`}><ReceiptText /> Dodaj paragon</Link></Button>
          <Button asChild variant="outline" size="lg"><Link to={`/inventory/${id}/summary`}><ClipboardCheck /> Podsumowanie ({inventoryItems.length})</Link></Button>
        </div>
      </div>

      {(availableProducts.length === 0 || rooms.length === 0) && !isLoading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">Przed rozpoczęciem inwentaryzacji uzupełnij dane podstawowe.</p>
          <p className="mt-1">
            {availableProducts.length === 0 && "Pierwszy produkt możesz dodać bezpośrednio w formularzu poniżej. "}
            {rooms.length === 0 && <>Dodaj co najmniej jedną <Link className="font-bold underline" to="/rooms">strefę sklepu</Link>.</>}
          </p>
        </div>
      )}

      {isLoading ? (
        <LoadingState variant="workspace" count={4} title="Przygotowywanie inwentaryzacji" description="Pobieram produkty, strefy i zapisane pozycje…" />
      ) : (
      <div className="app-workspace-grid grid items-start gap-5 xl:grid-cols-[390px_1fr]">
        <aside className="app-panel rounded-xl border bg-white p-5 shadow-sm xl:sticky xl:top-[92px]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Szybki zapis</p>
              <h2 className="mt-1 text-xl font-bold">Dodaj pozycję</h2>
            </div>
            {savedMessage && <span className="flex items-center gap-1 rounded-md bg-[#e8f3ed] px-2.5 py-1 text-xs font-bold text-primary"><Check className="size-3.5" /> {savedMessage}</span>}
          </div>
          <InventoryItemForm
            key={entryVersion}
            inventoryId={id}
            products={availableProducts}
            rooms={rooms}
            isPending={createInventoryMutation.isPending}
            onSubmit={handleCreate}
            onProductNotFound={openQuickProductDialog}
            onCreateProduct={() => openQuickProductDialog()}
            initialProductCode={productCodeToSelect}
            onInitialProductSelected={() => setProductCodeToSelect("")}
          />
          {createInventoryMutation.error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">Nie udało się zapisać pozycji. Sprawdź dane i spróbuj ponownie.</p>}
        </aside>

        <section className="app-panel min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Szukaj w pozycjach inwentaryzacji…" className="pl-12" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={categories.length === 0}>
              <SelectTrigger className="w-full lg:w-48" title={categories.length === 0 ? "Brak kategorii w pozycjach inwentaryzacji" : undefined}>
                {categories.length === 0 ? <span className="truncate">Brak kategorii</span> : <SelectValue placeholder="Kategoria" />}
              </SelectTrigger>
              <SelectContent isEmpty={categories.length === 0} emptyMessage="Brak kategorii w pozycjach inwentaryzacji">
                {categories.length > 0 && <SelectItem value="all">Wszystkie kategorie</SelectItem>}
                {categories.map(([categoryId, name]) => <SelectItem key={categoryId} value={categoryId}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={roomFilter} onValueChange={setRoomFilter} disabled={rooms.length === 0}>
              <SelectTrigger className="w-full lg:w-48" title={rooms.length === 0 ? "Brak stref" : undefined}>
                {rooms.length === 0 ? <span className="truncate">Brak stref</span> : <SelectValue placeholder="Strefa" />}
              </SelectTrigger>
              <SelectContent isEmpty={rooms.length === 0} emptyMessage="Brak stref">
                {rooms.length > 0 && <SelectItem value="all">Wszystkie strefy</SelectItem>}
                {rooms.map((room) => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-5 flex items-center justify-between border-b pb-3">
            <h2 className="font-bold">Pozycje inwentaryzacji</h2>
            <span className="text-sm font-medium text-muted-foreground">{filteredItems.length} z {inventoryItems.length}</span>
          </div>

          {error ? (
            <p className="py-10 text-center text-sm text-red-700">Nie udało się pobrać pozycji z serwera.</p>
          ) : filteredItems.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground"><PackageOpen /></div>
              <p className="mt-4 font-bold">{inventoryItems.length === 0 ? "Inwentaryzacja jest jeszcze pusta" : "Brak pasujących pozycji"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{inventoryItems.length === 0 ? "Pierwszy produkt dodaj w formularzu obok." : "Zmień wyszukiwanie lub filtry."}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredItems.map((item) => (
                <article key={item.id} className="app-data-row grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_150px_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-bold">{item.product?.name ?? "Produkt usunięty"}</h3>
                      {item.product?.category && <span className="hidden rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground md:inline">{item.product.category.name}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-mono">{item.product?.code ?? "brak kodu"}</span>
                      <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {item.room?.name ?? "Strefa usunięta"}</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 sm:block sm:text-right">
                    <p className="text-xl font-black text-primary">{item.product ? formatQuantity(item.quantity, item.product.unit) : item.quantity}</p>
                    {item.product && <p className="text-xs text-muted-foreground sm:mt-0.5">{unitLabels[item.product.unit]}</p>}
                  </div>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" aria-label="Edytuj pozycję" onClick={() => setEditingItem(item)}><Edit3 /></Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-red-50 hover:text-destructive" aria-label="Usuń pozycję" onClick={() => handleDelete(item)}><Trash2 /></Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      )}

      <Dialog open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="rounded-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edytuj pozycję inwentaryzacji</DialogTitle>
            <DialogDescription>Zmień produkt, strefę lub ilość. Zapis zostanie od razu zaktualizowany.</DialogDescription>
          </DialogHeader>
          <InventoryItemForm
            inventoryId={id}
            products={availableProducts}
            rooms={rooms}
            editingItem={editingItem}
            isPending={updateInventoryMutation.isPending}
            onSubmit={handleUpdate}
            onCancel={() => setEditingItem(null)}
            onProductNotFound={openQuickProductDialog}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isQuickProductDialogOpen} onOpenChange={(open) => !open && closeQuickProductDialog()}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{quickProductCode ? "Dodaj zeskanowany produkt" : "Dodaj nowy produkt"}</DialogTitle>
            <DialogDescription>
              {quickProductCode
                ? `Kod ${quickProductCode} nie istnieje w katalogu. Uzupełnij dane, a produkt od razu wróci do formularza pozycji.`
                : "Uzupełnij dane, a produkt zostanie od razu wybrany w formularzu pozycji."}
            </DialogDescription>
          </DialogHeader>
          {catalogCategories.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Najpierw dodaj <Link className="font-bold underline" to="/categories">kategorię produktu</Link>.</div>
          ) : (
            <ProductForm
              initialCode={quickProductCode}
              categories={catalogCategories}
              onSubmit={handleQuickProductCreate}
              onCancel={closeQuickProductDialog}
              isPending={createProductMutation.isPending}
            />
          )}
          {createProductMutation.error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800">Nie udało się dodać produktu. Ten kod może już istnieć w katalogu.</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default InventoryPositionsPage;
