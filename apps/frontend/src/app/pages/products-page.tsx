import type { Product } from "@/api/products";
import { BarcodeScannerButton } from "@/app/components/barcode-scanner";
import { ProductForm, type ProductFormValues } from "@/app/components/forms/product-form";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { useCategories } from "@/hooks/categories";
import { useProductMutations, useProducts } from "@/hooks/products";
import { normalizedProductCode } from "@/utils/barcode";
import { normalizeSearch, unitLabels } from "@/utils/inventory";
import { Barcode, CheckCircle2, Edit3, PackageOpen, Plus, Search, Tag, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

export function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedCode = searchParams.get("code")?.trim() ?? "";
  const requestedReturnTo = searchParams.get("returnTo") ?? "";
  const safeReturnTo = requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//") ? requestedReturnTo : "";
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [initialCode, setInitialCode] = useState("");
  const [handledRequestedCode, setHandledRequestedCode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [scanNotice, setScanNotice] = useState("");
  const { data: products = [], isLoading, error } = useProducts();
  const { data: categories = [] } = useCategories();
  const { createProductMutation, deleteProductMutation, updateProductMutation } = useProductMutations();
  const isSaving = createProductMutation.isPending || updateProductMutation.isPending;

  const filteredProducts = useMemo(() => {
    const query = normalizeSearch(searchTerm);
    return products.filter((product) => !query || normalizeSearch(`${product.name} ${product.code}`).includes(query));
  }, [products, searchTerm]);

  useEffect(() => {
    if (!requestedCode || isLoading || handledRequestedCode === requestedCode) return;
    const existingProduct = products.find((product) => normalizedProductCode(product.code) === normalizedProductCode(requestedCode));
    setHandledRequestedCode(requestedCode);

    if (existingProduct) {
      setSearchTerm(existingProduct.code);
      setScanNotice(`Produkt ${existingProduct.name} jest już w katalogu.`);
      if (safeReturnTo) navigate(safeReturnTo, { replace: true });
      return;
    }

    setEditingProduct(null);
    setInitialCode(requestedCode);
    setIsDialogOpen(true);
  }, [handledRequestedCode, isLoading, navigate, products, requestedCode, safeReturnTo]);

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setInitialCode("");
    if (requestedCode) navigate(safeReturnTo || "/products", { replace: true });
  };

  const handleSubmit = (data: ProductFormValues, isEditing: boolean) => {
    if (isEditing && editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, updates: data }, { onSuccess: closeDialog });
    } else {
      createProductMutation.mutate(data, {
        onSuccess: () => {
          setIsDialogOpen(false);
          setEditingProduct(null);
          setInitialCode("");
          setSearchTerm(data.code);
          setScanNotice(`Dodano ${data.name}. Produkt jest gotowy do wybrania podczas liczenia.`);
          if (safeReturnTo) navigate(safeReturnTo, { replace: true });
          else if (requestedCode) navigate("/products", { replace: true });
        },
      });
    }
  };

  const handleScan = (code: string) => {
    const existingProduct = products.find((product) => normalizedProductCode(product.code) === normalizedProductCode(code));
    setSearchTerm(code);

    if (existingProduct) {
      setScanNotice(`Znaleziono: ${existingProduct.name}`);
      return;
    }

    setScanNotice(`Kod ${code} nie istnieje jeszcze w katalogu — uzupełnij nazwę i kategorię.`);
    setEditingProduct(null);
    setInitialCode(code);
    setIsDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`Usunąć produkt „${product.name}”?`)) deleteProductMutation.mutate(product.id);
  };

  const categoryName = (categoryId: string | null) => categories.find((category) => category.id === categoryId)?.name ?? "Bez kategorii";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Katalog sklepu</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Produkty</h1>
          <p className="mt-2 text-muted-foreground">Kody i jednostki używane podczas liczenia.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => open ? setIsDialogOpen(true) : closeDialog()}>
          <DialogTrigger asChild><Button size="lg" onClick={() => { setEditingProduct(null); setInitialCode(""); }}><Plus /> Dodaj produkt</Button></DialogTrigger>
          <DialogContent className="rounded-[24px] sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">{editingProduct ? "Edytuj produkt" : "Nowy produkt"}</DialogTitle>
              <DialogDescription>Podaj nazwę, kod do wyszukiwania, jednostkę i kategorię.</DialogDescription>
            </DialogHeader>
            <ProductForm editingProduct={editingProduct} initialCode={initialCode} categories={categories} onSubmit={handleSubmit} onCancel={closeDialog} isPending={isSaving} />
            {(createProductMutation.error || updateProductMutation.error) && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-800">Nie udało się zapisać produktu. Sprawdź, czy ten kod nie jest już używany.</p>}
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 && !isLoading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Najpierw dodaj co najmniej jedną <Link to="/categories" className="font-bold underline">kategorię produktu</Link>.</div>
      )}

      <div className="max-w-2xl space-y-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setScanNotice(""); }} placeholder="Szukaj po nazwie lub kodzie…" className="pl-12" />
          </div>
          <BarcodeScannerButton onDetected={handleScan} />
        </div>
        {scanNotice && <p className="flex items-start gap-2 rounded-xl bg-[#e8f3ed] px-3 py-2 text-sm font-semibold text-primary"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {scanNotice}</p>}
      </div>

      {error ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Nie udało się pobrać produktów.</p>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-48 animate-pulse rounded-[24px] border bg-white/60" />)}</div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState icon={PackageOpen} title={products.length ? "Brak pasujących produktów" : "Katalog jest pusty"} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <article key={product.id} className="rounded-[24px] border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-[#e8f3ed] text-primary"><Barcode /></div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label={`Edytuj ${product.name}`} onClick={() => { setInitialCode(""); setEditingProduct(product); setIsDialogOpen(true); }}><Edit3 /></Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-red-50 hover:text-destructive" aria-label={`Usuń ${product.name}`} onClick={() => handleDelete(product)}><Trash2 /></Button>
                </div>
              </div>
              <h2 className="mt-4 truncate text-lg font-bold">{product.name}</h2>
              <p className="mt-1 font-mono text-sm text-muted-foreground">{product.code}</p>
              <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4 text-sm">
                <span className="flex min-w-0 items-center gap-1.5 truncate text-muted-foreground"><Tag className="size-4 shrink-0" /> {categoryName(product.categoryId)}</span>
                <span className="shrink-0 rounded-lg bg-muted px-2.5 py-1 font-bold">{unitLabels[product.unit]}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, title }: { icon: typeof PackageOpen; title: string }) {
  return <div className="rounded-[28px] border border-dashed bg-white px-6 py-14 text-center"><Icon className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 font-bold">{title}</p></div>;
}

export default ProductsPage;
