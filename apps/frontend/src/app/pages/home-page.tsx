import { useInventories } from "@/hooks/inventories";
import { useProducts } from "@/hooks/products";
import { useRooms } from "@/hooks/rooms";
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  MapPin,
  PackageSearch,
  Plus,
  ScanBarcode,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

export function HomePage() {
  const { data: inventories = [] } = useInventories();
  const { data: products = [] } = useProducts();
  const { data: rooms = [] } = useRooms();
  const latestInventory = inventories[0];

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[28px] bg-[#173b2d] text-white shadow-sm">
        <div className="grid gap-7 px-6 py-7 md:grid-cols-[1fr_auto] md:items-end md:px-8 md:py-9">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#f7df55]">
              <CheckCircle2 className="size-4" />
              Stanowisko gotowe
            </div>
            <h1 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              Dzień dobry! Co dziś liczymy?
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Rozpocznij nowy arkusz albo wróć do ostatniej inwentaryzacji. Wszystkie zmiany zapisują się od razu.
            </p>
          </div>

          <Button asChild size="lg" className="h-14 bg-[#ffdc24] px-6 font-bold text-[#263126] shadow-none hover:bg-[#ffe45a]">
            <Link to="/inventory?new=true">
              <Plus className="size-5" />
              Nowa inwentaryzacja
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <DashboardStat icon={ClipboardList} label="Arkusze" value={inventories.length} tone="green" />
        <DashboardStat icon={ScanBarcode} label="Produkty" value={products.length} tone="yellow" />
        <DashboardStat icon={MapPin} label="Strefy sklepu" value={rooms.length} tone="blue" />
        <DashboardStat
          icon={Boxes}
          label="Ostatni arkusz"
          value={latestInventory?.itemCount ?? 0}
          suffix="pozycji"
          tone="red"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[24px] border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Ostatnia praca</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">{latestInventory ? latestInventory.name : "Brak inwentaryzacji"}</h2>
            </div>
            {latestInventory && (
              <span className="rounded-full bg-[#e8f3ed] px-3 py-1.5 text-xs font-bold text-primary">W toku</span>
            )}
          </div>

          {latestInventory ? (
            <>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl bg-[#f5f6f2] p-4">
                  <CalendarDays className="size-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data arkusza</p>
                    <p className="font-semibold">{formatDate(latestInventory.date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-[#f5f6f2] p-4">
                  <PackageSearch className="size-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Zapisane pozycje</p>
                    <p className="font-semibold">{latestInventory.itemCount ?? 0}</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="sm:min-w-56">
                  <Link to={`/inventory/${latestInventory.id}/positions`}>
                    Kontynuuj liczenie <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={`/inventory/${latestInventory.id}/summary`}>Zobacz podsumowanie</Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed p-7 text-center">
              <p className="text-muted-foreground">Utwórz pierwszy arkusz, aby rozpocząć liczenie produktów.</p>
            </div>
          )}
        </div>

        <div className="rounded-[24px] border bg-white p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Przed liczeniem</p>
          <h2 className="mt-1 text-xl font-bold">Szybka kontrola</h2>
          <div className="mt-5 space-y-3">
            <ChecklistItem done={products.length > 0} label="Katalog produktów" detail={`${products.length} produktów`} />
            <ChecklistItem done={rooms.length > 0} label="Strefy sklepu" detail={`${rooms.length} stref`} />
            <ChecklistItem done={inventories.length > 0} label="Arkusz roboczy" detail={`${inventories.length} arkuszy`} />
          </div>
        </div>
      </section>
    </div>
  );
}

type StatTone = "green" | "yellow" | "blue" | "red";

const statTones: Record<StatTone, string> = {
  green: "bg-[#e8f3ed] text-[#08784f]",
  yellow: "bg-[#fff6c9] text-[#7c6411]",
  blue: "bg-[#e8f0fa] text-[#315f96]",
  red: "bg-[#fdebec] text-[#b72128]",
};

function DashboardStat({ icon: Icon, label, value, suffix, tone }: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  suffix?: string;
  tone: StatTone;
}) {
  return (
    <div className="rounded-[20px] border bg-white p-4 shadow-sm sm:p-5">
      <div className={`mb-4 grid size-10 place-items-center rounded-xl ${statTones[tone]}`}>
        <Icon className="size-5" />
      </div>
      <p className="text-2xl font-black tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground sm:text-sm">{suffix ?? label}</p>
    </div>
  );
}

function ChecklistItem({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#f5f6f2] p-3.5">
      <div className={`grid size-9 shrink-0 place-items-center rounded-full ${done ? "bg-primary text-white" : "bg-white text-muted-foreground"}`}>
        <CheckCircle2 className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export default HomePage;
