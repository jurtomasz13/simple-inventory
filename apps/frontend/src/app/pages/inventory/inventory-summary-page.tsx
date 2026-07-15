import type { InventoryItem } from "@/api/inventory-items";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { useInventory } from "@/hooks/inventories";
import { useInventoryItems } from "@/hooks/use-inventory-items";
import { useOrders } from "@/hooks/orders";
import { formatQuantity, normalizeSearch, unitLabels } from "@/utils/inventory";
import {
  buildInventoryReport,
  type CategoryReportGroup,
  type ProductSaleTotal,
  type ReportSortDirection,
  type ReportSortField,
  type ReportUnit,
} from "@/utils/inventory-report";
import {
  ArrowDownAZ,
  ArrowLeft,
  ArrowUpAZ,
  AlertTriangle,
  Boxes,
  ChevronDown,
  Download,
  Filter,
  Layers3,
  MapPin,
  PackageCheck,
  Printer,
  ReceiptText,
  RotateCcw,
  Scale,
  Search,
  SlidersHorizontal,
  Tag,
  Warehouse,
} from "lucide-react";
import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

const reportUnitLabels: Record<ReportUnit, string> = {
  ...unitLabels,
  UNKNOWN: "brak jednostki",
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(date));

const number = (value: number, maximumFractionDigits = 3) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits }).format(value);

function formatReportQuantity(quantity: number, unit: ReportUnit) {
  if (unit === "UNKNOWN") return number(quantity);
  return formatQuantity(quantity, unit);
}

function escapeCsv(value: string | number) {
  const safeValue = String(value).replace(/"/g, '""');
  return `"${safeValue}"`;
}

type FilterOption = { value: string; label: string; count: number };

export function InventorySummaryPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: inventory, isLoading: isLoadingInventory } = useInventory(id);
  const { data: items = [], isLoading: isLoadingItems, error } = useInventoryItems(id);
  const { data: orders = [], isLoading: isLoadingOrders, error: ordersError } = useOrders(id);

  const search = searchParams.get("q") ?? "";
  const categoryFilters = searchParams.getAll("category");
  const roomFilters = searchParams.getAll("room");
  const unitFilters = searchParams.getAll("unit");
  const productFilter = searchParams.get("product") ?? "all";
  const saleFilter = searchParams.get("sale") ?? "all";
  const minQuantity = searchParams.get("min") ?? "";
  const maxQuantity = searchParams.get("max") ?? "";
  const sortField = (searchParams.get("sort") ?? "name") as ReportSortField;
  const sortDirection = (searchParams.get("direction") ?? "asc") as ReportSortDirection;

  const filterOptions = useMemo(() => buildFilterOptions(items), [items]);

  const salesByProduct = useMemo(() => {
    const totals = new Map<string, ProductSaleTotal>();
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (!item.productId) return;
        const total = totals.get(item.productId) ?? { quantity: 0, orderCount: 0 };
        total.quantity += item.quantity;
        total.orderCount += 1;
        totals.set(item.productId, total);
      });
    });
    return totals;
  }, [orders]);

  const baseFilteredItems = useMemo(() => {
    const query = normalizeSearch(search);
    const minimum = minQuantity === "" ? null : Number(minQuantity.replace(",", "."));
    const maximum = maxQuantity === "" ? null : Number(maxQuantity.replace(",", "."));

    return items.filter((item) => {
      const categoryId = item.product?.category?.id ?? "none";
      const roomId = item.room?.id ?? "deleted";
      const unit = item.product?.unit ?? "UNKNOWN";
      const productId = item.product?.id ?? "deleted";
      const matchesSearch = !query || normalizeSearch(`${item.product?.name ?? ""} ${item.product?.code ?? ""} ${item.room?.name ?? ""}`).includes(query);

      return matchesSearch
        && (categoryFilters.length === 0 || categoryFilters.includes(categoryId))
        && (roomFilters.length === 0 || roomFilters.includes(roomId))
        && (unitFilters.length === 0 || unitFilters.includes(unit))
        && (productFilter === "all" || productFilter === productId)
        && (minimum === null || !Number.isFinite(minimum) || item.quantity >= minimum)
        && (maximum === null || !Number.isFinite(maximum) || item.quantity <= maximum);
    });
  }, [items, search, categoryFilters, roomFilters, unitFilters, productFilter, minQuantity, maxQuantity]);

  const filteredItems = useMemo(() => {
    if (saleFilter === "all") return baseFilteredItems;
    const countedByProduct = baseFilteredItems.reduce((totals, item) => {
      if (item.productId) totals.set(item.productId, (totals.get(item.productId) ?? 0) + item.quantity);
      return totals;
    }, new Map<string, number>());
    return baseFilteredItems.filter((item) => {
      const sold = item.productId ? salesByProduct.get(item.productId)?.quantity ?? 0 : 0;
      if (saleFilter === "affected") return sold > 0;
      if (saleFilter === "unaffected") return sold === 0;
      if (saleFilter === "negative") return Boolean(item.productId) && (countedByProduct.get(item.productId as string) ?? 0) - sold < 0;
      return true;
    });
  }, [baseFilteredItems, saleFilter, salesByProduct]);

  const report = useMemo(
    () => buildInventoryReport(filteredItems, sortField, sortDirection, salesByProduct),
    [filteredItems, sortField, sortDirection, salesByProduct]
  );
  const balanceTotals = useMemo(() => report.reduce<Record<ReportUnit, { counted: number; sold: number; adjusted: number }>>((totals, category) => {
    category.units.forEach((unit) => {
      totals[unit.unit].counted += unit.quantity;
      totals[unit.unit].sold += unit.soldQuantity;
      totals[unit.unit].adjusted += unit.adjustedQuantity;
    });
    return totals;
  }, {
    PIECE: { counted: 0, sold: 0, adjusted: 0 },
    KILOGRAM: { counted: 0, sold: 0, adjusted: 0 },
    LITER: { counted: 0, sold: 0, adjusted: 0 },
    UNKNOWN: { counted: 0, sold: 0, adjusted: 0 },
  }), [report]);
  const uniqueProducts = new Set(filteredItems.map((item) => item.product?.id ?? `deleted-${item.id}`)).size;
  const uniqueCategories = new Set(filteredItems.map((item) => item.product?.category?.id ?? "none")).size;
  const uniqueRooms = new Set(filteredItems.map((item) => item.room?.id ?? "deleted")).size;
  const activeFilterCount = categoryFilters.length + roomFilters.length + unitFilters.length
    + Number(Boolean(search)) + Number(productFilter !== "all") + Number(saleFilter !== "all") + Number(Boolean(minQuantity)) + Number(Boolean(maxQuantity));

  const categoryDistribution = useMemo(() => createDistribution(filteredItems, "category"), [filteredItems]);
  const roomDistribution = useMemo(() => createDistribution(filteredItems, "room"), [filteredItems]);

  const setSingleParam = (name: string, value: string, defaultValue = "") => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) next.delete(name);
    else next.set(name, value);
    setSearchParams(next, { replace: true });
  };

  const setMultipleParams = (name: string, values: string[]) => {
    const next = new URLSearchParams(searchParams);
    next.delete(name);
    values.forEach((value) => next.append(name, value));
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    const next = new URLSearchParams();
    if (sortField !== "name") next.set("sort", sortField);
    if (sortDirection !== "asc") next.set("direction", sortDirection);
    setSearchParams(next, { replace: true });
  };

  const downloadCsv = () => {
    const header = ["Kategoria", "Jednostka", "Produkt", "Kod", "Strefy", "Policzono", "Sprzedano po przeliczeniu", "Po korekcie", "Liczba wpisów", "Liczba paragonów"];
    const rows = report.flatMap((category) => category.units.flatMap((unit) =>
      unit.products.map((product) => [
        category.name,
        reportUnitLabels[unit.unit],
        product.name,
        product.code,
        product.rooms.map((room) => `${room.name}: ${formatReportQuantity(room.quantity, product.unit)}`).join(" | "),
        product.quantity,
        product.soldQuantity,
        product.adjustedQuantity,
        product.entryCount,
        product.orderCount,
      ])
    ));
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${inventory?.name ?? "inwentaryzacja"}-raport.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoadingInventory || isLoadingItems || isLoadingOrders) {
    return <div className="h-80 animate-pulse rounded-[28px] border bg-white/60" />;
  }

  if (error || ordersError || !inventory) {
    return (
      <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-red-900">
        <h1 className="text-xl font-bold">Nie udało się otworzyć podsumowania</h1>
        <p className="mt-2 text-sm">Arkusz nie istnieje albo serwer jest chwilowo niedostępny.</p>
        <Button asChild variant="outline" className="mt-5"><Link to="/inventory"><ArrowLeft /> Wróć do listy</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link to={`/inventory/${id}/positions`} className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-muted-foreground hover:text-foreground print:hidden">
            <ArrowLeft className="size-4" /> Wróć do liczenia
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Raport inwentaryzacji</p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.035em] sm:text-4xl">{inventory.name}</h1>
          <p className="mt-2 text-muted-foreground">Arkusz z dnia {formatDate(inventory.date)} · grupowanie: kategoria → jednostka → produkt</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row print:hidden">
          <Button asChild variant="outline" size="lg"><Link to={`/orders?inventory=${id}`}><ReceiptText /> Paragony ({orders.length})</Link></Button>
          <Button variant="outline" size="lg" onClick={downloadCsv} disabled={filteredItems.length === 0}><Download /> CSV ({filteredItems.length})</Button>
          <Button size="lg" onClick={() => window.print()}><Printer /> Drukuj widok</Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryStat icon={PackageCheck} label={filteredItems.length === items.length ? "Wszystkie wpisy" : `Z ${items.length} wpisów`} value={String(filteredItems.length)} />
        <SummaryStat icon={Boxes} label="Różne produkty" value={String(uniqueProducts)} />
        <SummaryStat icon={ReceiptText} label="Paragony po liczeniu" value={String(orders.length)} />
        <SummaryStat icon={Tag} label="Kategorie" value={String(uniqueCategories)} />
        <SummaryStat icon={Warehouse} label="Strefy" value={String(uniqueRooms)} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <BalanceStat icon={Boxes} label="Produkty na sztuki" unit="szt." balance={balanceTotals.PIECE} tone="yellow" />
        <BalanceStat icon={Scale} label="Produkty ważone" unit="kg" balance={balanceTotals.KILOGRAM} tone="green" />
        <BalanceStat icon={Scale} label="Produkty płynne" unit="l" balance={balanceTotals.LITER} tone="blue" />
      </section>

      {report.some((category) => category.units.some((unit) => unit.products.some((product) => product.adjustedQuantity < 0))) && <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><div><p className="font-bold">Sprzedaż przekracza policzony stan co najmniej jednego produktu.</p><p className="mt-1">Użyj filtra „Stan ujemny”, aby znaleźć pozycje wymagające sprawdzenia.</p></div></div>}

      <section className="rounded-[24px] border bg-white p-4 shadow-sm print:hidden sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-primary"><SlidersHorizontal className="size-4" /> Filtry raportu</p>
            <p className="mt-1 text-sm text-muted-foreground">Filtry wpływają na statystyki, grupy, wydruk i CSV. Sprzedaż jest korektą całego produktu, bez przypisania do konkretnej strefy.</p>
          </div>
          <Button variant="ghost" onClick={resetFilters} disabled={activeFilterCount === 0}><RotateCcw /> Wyczyść {activeFilterCount > 0 && `(${activeFilterCount})`}</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.4fr)_repeat(3,minmax(150px,0.75fr))]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSingleParam("q", event.target.value)} placeholder="Produkt, kod lub strefa…" className="pl-12" />
          </div>
          <MultiFilter label="Kategorie" values={categoryFilters} options={filterOptions.categories} onChange={(values) => setMultipleParams("category", values)} />
          <MultiFilter label="Jednostki" values={unitFilters} options={filterOptions.units} onChange={(values) => setMultipleParams("unit", values)} />
          <MultiFilter label="Strefy" values={roomFilters} options={filterOptions.rooms} onChange={(values) => setMultipleParams("room", values)} />
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.2fr)_minmax(190px,0.8fr)_120px_120px_minmax(180px,0.8fr)_56px]">
          <Select value={productFilter} onValueChange={(value) => setSingleParam("product", value, "all")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Wszystkie produkty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie produkty</SelectItem>
              {filterOptions.products.map((option) => <SelectItem key={option.value} value={option.value}>{option.label} ({option.count})</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={saleFilter} onValueChange={(value) => setSingleParam("sale", value, "all")}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie stany sprzedaży</SelectItem>
              <SelectItem value="affected">Sprzedane po przeliczeniu</SelectItem>
              <SelectItem value="unaffected">Bez późniejszej sprzedaży</SelectItem>
              <SelectItem value="negative">Stan po korekcie ujemny</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" inputMode="decimal" min="0" value={minQuantity} onChange={(event) => setSingleParam("min", event.target.value)} placeholder="Ilość od" aria-label="Minimalna ilość wpisu" />
          <Input type="number" inputMode="decimal" min="0" value={maxQuantity} onChange={(event) => setSingleParam("max", event.target.value)} placeholder="Ilość do" aria-label="Maksymalna ilość wpisu" />
          <Select value={sortField} onValueChange={(value) => setSingleParam("sort", value, "name")}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sortuj: nazwa</SelectItem>
              <SelectItem value="code">Sortuj: kod</SelectItem>
              <SelectItem value="quantity">Sortuj: łączna ilość</SelectItem>
              <SelectItem value="sold">Sortuj: sprzedano</SelectItem>
              <SelectItem value="adjusted">Sortuj: stan po korekcie</SelectItem>
              <SelectItem value="entries">Sortuj: liczba wpisów</SelectItem>
              <SelectItem value="rooms">Sortuj: liczba stref</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setSingleParam("direction", sortDirection === "asc" ? "desc" : "asc", "asc")} aria-label={sortDirection === "asc" ? "Sortuj malejąco" : "Sortuj rosnąco"}>
            {sortDirection === "asc" ? <ArrowDownAZ /> : <ArrowUpAZ />}
          </Button>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <DistributionCard icon={MapPin} title="Wpisy według strefy" items={roomDistribution} />
        <DistributionCard icon={Tag} title="Wpisy według kategorii" items={categoryDistribution} />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Szczegółowy wykaz</p><h2 className="mt-1 text-2xl font-black">Kategorie i produkty</h2></div>
          <p className="text-sm font-medium text-muted-foreground">{report.length} kategorii · {uniqueProducts} produktów · {filteredItems.length} wpisów</p>
        </div>

        {report.length === 0 ? (
          <div className="rounded-[24px] border border-dashed bg-white px-6 py-14 text-center"><Filter className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 font-bold">Brak danych spełniających filtry</p><Button variant="outline" className="mt-4 print:hidden" onClick={resetFilters}><RotateCcw /> Wyczyść filtry</Button></div>
        ) : report.map((category) => <CategoryGroup key={category.id} category={category} />)}
      </section>
    </div>
  );
}

function buildFilterOptions(items: InventoryItem[]) {
  const categories = new Map<string, FilterOption>();
  const rooms = new Map<string, FilterOption>();
  const units = new Map<string, FilterOption>();
  const products = new Map<string, FilterOption>();

  items.forEach((item) => {
    incrementOption(categories, item.product?.category?.id ?? "none", item.product?.category?.name ?? "Bez kategorii");
    incrementOption(rooms, item.room?.id ?? "deleted", item.room?.name ?? "Strefa usunięta");
    incrementOption(units, item.product?.unit ?? "UNKNOWN", reportUnitLabels[item.product?.unit ?? "UNKNOWN"]);
    incrementOption(products, item.product?.id ?? "deleted", item.product ? `${item.product.name} · ${item.product.code}` : "Produkt usunięty");
  });

  const sort = (values: Map<string, FilterOption>) => [...values.values()].sort((a, b) => a.label.localeCompare(b.label, "pl", { numeric: true }));
  return { categories: sort(categories), rooms: sort(rooms), units: sort(units), products: sort(products) };
}

function incrementOption(target: Map<string, FilterOption>, value: string, label: string) {
  const option = target.get(value) ?? { value, label, count: 0 };
  option.count += 1;
  target.set(value, option);
}

function createDistribution(items: InventoryItem[], type: "category" | "room") {
  const groups = new Map<string, { name: string; entries: number; products: Set<string> }>();
  items.forEach((item) => {
    const id = type === "category" ? item.product?.category?.id ?? "none" : item.room?.id ?? "deleted";
    const name = type === "category" ? item.product?.category?.name ?? "Bez kategorii" : item.room?.name ?? "Strefa usunięta";
    const group = groups.get(id) ?? { name, entries: 0, products: new Set<string>() };
    group.entries += 1;
    if (item.product?.id) group.products.add(item.product.id);
    groups.set(id, group);
  });
  return [...groups.values()].map((group) => ({ name: group.name, entries: group.entries, products: group.products.size })).sort((a, b) => b.entries - a.entries);
}

function MultiFilter({ label, values, options, onChange }: { label: string; values: string[]; options: FilterOption[]; onChange: (values: string[]) => void }) {
  const toggle = (value: string) => onChange(values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]);
  return (
    <Popover>
      <PopoverTrigger asChild><Button variant={values.length ? "default" : "outline"} className="w-full justify-between"><span className="flex items-center gap-2"><Filter /> {values.length ? `${label}: ${values.length}` : label}</span><ChevronDown /></Button></PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <div className="mb-2 flex items-center justify-between"><p className="text-sm font-bold">{label}</p>{values.length > 0 && <Button variant="ghost" size="sm" onClick={() => onChange([])}>Wyczyść</Button>}</div>
        <div className="max-h-64 space-y-1 overflow-auto">
          {options.map((option) => <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-2 hover:bg-muted"><Checkbox checked={values.includes(option.value)} onCheckedChange={() => toggle(option.value)} /><span className="min-w-0 flex-1 truncate text-sm font-medium">{option.label}</span><span className="text-xs text-muted-foreground">{option.count}</span></label>)}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SummaryStat({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: string }) {
  return <div className="rounded-[20px] border bg-white p-4 shadow-sm sm:p-5"><div className="grid size-10 place-items-center rounded-xl bg-[#e8f3ed] text-primary"><Icon className="size-5" /></div><p className="mt-4 text-2xl font-black tracking-tight">{value}</p><p className="mt-0.5 text-sm text-muted-foreground">{label}</p></div>;
}

const quantityTones = { yellow: "bg-[#fff4be] text-[#775d00]", green: "bg-[#e8f3ed] text-primary", blue: "bg-[#e8f0fa] text-[#315f96]" };

function BalanceStat({ icon: Icon, label, unit, balance, tone }: { icon: typeof Scale; label: string; unit: string; balance: { counted: number; sold: number; adjusted: number }; tone: keyof typeof quantityTones }) {
  return <div className="rounded-[20px] border bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><div className={`grid size-11 shrink-0 place-items-center rounded-2xl ${quantityTones[tone]}`}><Icon /></div><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="text-xl font-black">{number(balance.adjusted)} <span className="text-sm text-muted-foreground">{unit} po korekcie</span></p></div></div><div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3 text-xs"><div><p className="text-muted-foreground">Policzono</p><p className="mt-0.5 font-bold">{number(balance.counted)} {unit}</p></div><div><p className="text-muted-foreground">Sprzedano później</p><p className="mt-0.5 font-bold text-[#b72128]">− {number(balance.sold)} {unit}</p></div></div></div>;
}

function DistributionCard({ icon: Icon, title, items }: { icon: typeof MapPin; title: string; items: { name: string; entries: number; products: number }[] }) {
  const max = Math.max(...items.map((item) => item.entries), 1);
  return <div className="rounded-[24px] border bg-white p-5 shadow-sm sm:p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><Icon className="size-5 text-primary" /> {title}</h2>{items.length === 0 ? <p className="mt-5 text-sm text-muted-foreground">Brak danych</p> : <div className="mt-5 space-y-4">{items.slice(0, 8).map((item) => <div key={item.name}><div className="mb-1.5 flex items-center justify-between gap-4 text-sm"><span className="truncate font-semibold">{item.name}</span><span className="shrink-0 text-xs font-bold text-muted-foreground">{item.entries} wpisów · {item.products} prod.</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(item.entries / max) * 100}%` }} /></div></div>)}</div>}</div>;
}

function CategoryGroup({ category }: { category: CategoryReportGroup }) {
  return (
    <details open className="overflow-hidden rounded-[24px] border bg-white shadow-sm print:break-inside-avoid">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 bg-[#173b2d] px-5 py-4 text-white marker:hidden sm:px-6">
        <div className="grid size-10 place-items-center rounded-xl bg-white/10"><Layers3 /></div>
        <div className="min-w-0 flex-1"><h3 className="truncate text-lg font-bold">{category.name}</h3><p className="text-xs text-white/65">{category.productCount} produktów · {category.entryCount} wpisów</p></div>
        <div className="flex flex-wrap justify-end gap-2">{category.units.map((unit) => <span key={unit.unit} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{formatReportQuantity(unit.quantity, unit.unit)} → {formatReportQuantity(unit.adjustedQuantity, unit.unit)}</span>)}</div>
        <ChevronDown className="size-5 details-chevron" />
      </summary>

      <div className="space-y-4 p-3 sm:p-5">
        {category.units.map((unit) => (
          <section key={unit.unit} className="overflow-hidden rounded-2xl border">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f5f6f2] px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-xl bg-white text-primary shadow-sm">{unit.unit === "PIECE" ? <Boxes className="size-4" /> : <Scale className="size-4" />}</div><div><h4 className="font-bold">{reportUnitLabels[unit.unit]}</h4><p className="text-xs text-muted-foreground">{unit.productCount} produktów · {unit.entryCount} wpisów</p></div></div>
              <BalanceValues unit={unit.unit} counted={unit.quantity} sold={unit.soldQuantity} adjusted={unit.adjustedQuantity} />
            </div>
            <div className="divide-y">
              {unit.products.map((product) => (
                <article key={product.id} className={`grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(190px,0.9fr)_minmax(240px,1fr)_minmax(300px,1.1fr)] lg:items-center ${product.soldQuantity > 0 ? "bg-amber-50/40" : ""}`}>
                  <div className="min-w-0"><div className="flex items-center gap-2"><h5 className="truncate font-bold">{product.name}</h5>{product.soldQuantity > 0 && <span className="shrink-0 rounded-full bg-[#fff4be] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#775d00]">sprzedaż</span>}</div><p className="mt-1 font-mono text-xs text-muted-foreground">{product.code} · {product.entryCount} {product.entryCount === 1 ? "wpis" : "wpisy"}{product.orderCount > 0 && ` · ${product.orderCount} par.`}</p></div>
                  <div className="flex flex-wrap gap-2">{product.rooms.map((room) => <span key={room.id} className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-2.5 py-1.5 text-xs"><MapPin className="size-3.5 text-primary" /><strong>{room.name}:</strong> {formatReportQuantity(room.quantity, product.unit)}{room.entryCount > 1 && <span className="text-muted-foreground">({room.entryCount}×)</span>}</span>)}</div>
                  <BalanceValues unit={product.unit} counted={product.quantity} sold={product.soldQuantity} adjusted={product.adjustedQuantity} />
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </details>
  );
}

function BalanceValues({ unit, counted, sold, adjusted }: { unit: ReportUnit; counted: number; sold: number; adjusted: number }) {
  return <div className="grid grid-cols-3 gap-2 text-right"><div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Policzono</p><p className="mt-1 text-sm font-bold">{formatReportQuantity(counted, unit)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Sprzedano</p><p className={`mt-1 text-sm font-bold ${sold > 0 ? "text-[#b72128]" : "text-muted-foreground"}`}>− {formatReportQuantity(sold, unit)}</p></div><div><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Po korekcie</p><p className={`mt-1 text-base font-black ${adjusted < 0 ? "text-destructive" : "text-primary"}`}>{formatReportQuantity(adjusted, unit)}</p></div></div>;
}

export default InventorySummaryPage;
