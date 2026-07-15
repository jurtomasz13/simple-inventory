import type { CreateOrder, Order } from "@/api/orders";
import type { ProductUnit } from "@/api/products";
import type { InventoryItemProduct } from "@/api/inventory-items";
import { OrderForm } from "@/app/components/forms/order-form";
import { Button } from "@/app/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useInventories } from "@/hooks/inventories";
import { useInventoryItems } from "@/hooks/use-inventory-items";
import { useOrderMutations, useOrders } from "@/hooks/orders";
import { formatQuantity } from "@/utils/inventory";
import { Boxes, Edit3, PackageOpen, ReceiptText, Scale, ShoppingBasket, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: inventories = [], isLoading: isLoadingInventories } = useInventories();
  const selectedInventoryId = searchParams.get("inventory") ?? inventories[0]?.id ?? "";
  const { data: inventoryItems = [], isLoading: isLoadingItems } = useInventoryItems(selectedInventoryId);
  const { data: orders = [], isLoading: isLoadingOrders, error } = useOrders(selectedInventoryId);
  const { createOrderMutation, updateOrderMutation, deleteOrderMutation } = useOrderMutations();
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const selectedInventory = inventories.find((inventory) => inventory.id === selectedInventoryId);
  const products = useMemo(() => [...inventoryItems.reduce((map, item) => {
    if (item.product) map.set(item.product.id, item.product);
    return map;
  }, new Map<string, InventoryItemProduct>()).values()], [inventoryItems]);
  const soldTotals = orders.reduce<Record<ProductUnit, number>>((totals, order) => {
    order.orderItems.forEach((item) => { if (item.product) totals[item.product.unit] += item.quantity; });
    return totals;
  }, { PIECE: 0, KILOGRAM: 0, LITER: 0 });

  const selectInventory = (inventoryId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("inventory", inventoryId);
    setSearchParams(next, { replace: true });
    setEditingOrder(null);
  };
  const handleCreate = (data: CreateOrder) => createOrderMutation.mutate(data, { onSuccess: () => setFormVersion((version) => version + 1) });
  const handleUpdate = (data: CreateOrder) => {
    if (!editingOrder) return;
    updateOrderMutation.mutate({ id: editingOrder.id, updates: data }, { onSuccess: () => setEditingOrder(null) });
  };
  const handleDelete = (order: Order) => {
    if (window.confirm(`Usunąć paragon „${order.name}”? Stan skorygowany zostanie przeliczony.`)) deleteOrderMutation.mutate(order.id);
  };
  const isLoading = isLoadingInventories || isLoadingItems || isLoadingOrders;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Sprzedaż po przeliczeniu</p><h1 className="mt-1 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Paragony w trakcie inwentaryzacji</h1><p className="mt-2 max-w-3xl text-muted-foreground">Zapisz produkty sprzedane już po ich policzeniu. Raport zachowa stan pierwotny i pokaże stan po korekcie.</p></div>
        <Select value={selectedInventoryId || undefined} onValueChange={selectInventory}><SelectTrigger className="w-full lg:w-80"><SelectValue placeholder="Wybierz inwentaryzację" /></SelectTrigger><SelectContent>{inventories.map((inventory) => <SelectItem key={inventory.id} value={inventory.id}>{inventory.name}</SelectItem>)}</SelectContent></Select>
      </div>

      {selectedInventory && <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-[#e8f3ed] px-4 py-3 text-sm"><span><strong>Aktywny arkusz:</strong> {selectedInventory.name}</span><div className="flex gap-2"><Button asChild variant="ghost" size="sm"><Link to={`/inventory/${selectedInventory.id}/positions`}>Liczenie</Link></Button><Button asChild variant="ghost" size="sm"><Link to={`/inventory/${selectedInventory.id}/summary`}>Podsumowanie</Link></Button></div></div>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat icon={ReceiptText} label="Paragony" value={String(orders.length)} /><Stat icon={Boxes} label="Sprzedane sztuki" value={formatQuantity(soldTotals.PIECE, "PIECE")} /><Stat icon={Scale} label="Sprzedana waga" value={formatQuantity(soldTotals.KILOGRAM, "KILOGRAM")} /><Stat icon={Scale} label="Sprzedana objętość" value={formatQuantity(soldTotals.LITER, "LITER")} /></section>

      {!selectedInventoryId ? <div className="rounded-[28px] border border-dashed bg-white px-6 py-16 text-center"><ShoppingBasket className="mx-auto size-9 text-muted-foreground" /><p className="mt-4 font-bold">Najpierw utwórz inwentaryzację</p></div> : (
        <div className="grid items-start gap-5 xl:grid-cols-[390px_1fr]">
          <aside className="rounded-[24px] border bg-white p-5 shadow-sm xl:sticky xl:top-[92px]"><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Nowa sprzedaż</p><h2 className="mt-1 text-xl font-bold">Dodaj paragon</h2></div><OrderForm key={`${selectedInventoryId}-${formVersion}`} inventoryId={selectedInventoryId} products={products} isPending={createOrderMutation.isPending} onSubmit={handleCreate} />{createOrderMutation.error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">Nie udało się zapisać paragonu. Sprawdź jego pozycje.</p>}</aside>
          <section className="rounded-[24px] border bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between border-b pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Historia korekt</p><h2 className="mt-1 text-xl font-bold">Zarejestrowane paragony</h2></div><span className="rounded-full bg-muted px-3 py-1 text-sm font-bold">{orders.length}</span></div>
            {error ? <p className="py-10 text-center text-sm text-red-700">Nie udało się pobrać paragonów.</p> : isLoading ? <div className="space-y-3 py-4">{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div> : orders.length === 0 ? <div className="py-14 text-center"><PackageOpen className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 font-bold">Brak sprzedaży po przeliczeniu</p><p className="mt-1 text-sm text-muted-foreground">Stan skorygowany jest obecnie równy stanowi policzonemu.</p></div> : <div className="divide-y">{orders.map((order) => <article key={order.id} className="py-4"><div className="flex items-start gap-3"><div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff4be] text-[#775d00]"><ReceiptText /></div><div className="min-w-0 flex-1"><h3 className="font-bold">{order.name}</h3><p className="mt-1 text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("pl-PL")} · {order.orderItems.length} pozycji</p></div><Button variant="ghost" size="icon" onClick={() => setEditingOrder(order)} aria-label="Edytuj paragon"><Edit3 /></Button><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(order)} aria-label="Usuń paragon"><Trash2 /></Button></div><div className="mt-3 flex flex-wrap gap-2 pl-14">{order.orderItems.map((item) => <span key={item.id} className="rounded-xl bg-muted px-2.5 py-1.5 text-xs"><strong>{item.product?.name ?? "Produkt usunięty"}</strong>: {item.product ? formatQuantity(item.quantity, item.product.unit) : item.quantity}</span>)}</div></article>)}</div>}
          </section>
        </div>
      )}

      <Dialog open={Boolean(editingOrder)} onOpenChange={(open) => !open && setEditingOrder(null)}><DialogContent className="max-h-[90vh] overflow-y-auto rounded-[24px] sm:max-w-2xl"><DialogHeader><DialogTitle className="text-2xl">Edytuj paragon</DialogTitle><DialogDescription>Zmiana pozycji natychmiast przeliczy stan skorygowany raportu.</DialogDescription></DialogHeader>{editingOrder && <OrderForm inventoryId={selectedInventoryId} products={products} editingOrder={editingOrder} isPending={updateOrderMutation.isPending} onSubmit={handleUpdate} onCancel={() => setEditingOrder(null)} />}</DialogContent></Dialog>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: string }) { return <div className="rounded-[20px] border bg-white p-4 shadow-sm"><div className="grid size-10 place-items-center rounded-xl bg-[#e8f3ed] text-primary"><Icon className="size-5" /></div><p className="mt-3 text-xl font-black">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>; }

export default OrdersPage;
